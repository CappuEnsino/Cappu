const db = require('../config/database');
const { preference, client } = require('../config/mercadopago');
const { Payment } = require('mercadopago');

const carrinhoController = {
    adicionarAoCarrinho: async (req, res) => {
        if (!req.user || !req.user.ID_USUARIO) {
            return res.status(401).json({ success: false, message: 'Usuário não autenticado' });
        }
        const { cursoId } = req.body;
        const userId = req.user.ID_USUARIO;
        if (!cursoId) {
            return res.status(400).json({ success: false, message: 'ID do curso não fornecido' });
        }
        try {
            const [carrinhoExistente] = await db.query('SELECT * FROM CARRINHO WHERE ID_USUARIO = ? AND ID_CURSO = ?', [userId, cursoId]);
            if (carrinhoExistente.length > 0) {
                return res.status(409).json({ success: false, message: 'Este curso já está no seu carrinho' });
            }
            const [compraExistente] = await db.query('SELECT * FROM COMPRA c JOIN CURSOS_COMPRA cc ON c.ID_COMPRA = cc.ID_COMPRA WHERE c.ID_USUARIO = ? AND cc.ID_CURSO = ? AND c.STATUS = 1', [userId, cursoId]);
            if (compraExistente.length > 0) {
                return res.status(409).json({ success: false, message: 'Você já possui este curso' });
            }
            const [result] = await db.query('INSERT INTO CARRINHO (ID_USUARIO, ID_CURSO, DATA_ADICAO) VALUES (?, ?, NOW())', [userId, cursoId]);
            res.json({ success: true, message: 'Curso adicionado ao carrinho com sucesso', data: { carrinhoId: result.insertId } });
        } catch (err) {
            console.error('Erro ao adicionar curso ao carrinho:', err);
            res.status(500).json({ success: false, message: 'Erro ao adicionar curso ao carrinho' });
        }
    },
    getContadorCarrinho: async (req, res) => {
        if (!req.user || !req.user.ID_USUARIO) {
            return res.status(401).json({ success: false, message: 'Usuário não autenticado' });
        }
        try {
            const [result] = await db.query('SELECT COUNT(*) as quantidade FROM CARRINHO WHERE ID_USUARIO = ?', [req.user.ID_USUARIO]);
            res.json({ success: true, quantidade: result[0].quantidade });
        } catch (err) {
            console.error('Erro ao obter contador do carrinho:', err);
            res.status(500).json({ success: false, message: 'Erro ao obter quantidade de itens no carrinho' });
        }
    },
    limparCarrinhoInvalidos: async (userId) => {
        try {
            await db.query(`
                DELETE c FROM CARRINHO c
                LEFT JOIN CURSOS cur ON c.ID_CURSO = cur.ID_CURSO
                WHERE c.ID_USUARIO = ? AND (cur.TITULO IS NULL OR cur.PRECO <= 0)
            `, [userId]);
        } catch (err) {
            console.error('Erro ao limpar carrinho inválido:', err);
        }
    },
    getCarrinho: async (req, res) => {
        if (!req.user || !req.user.ID_USUARIO) {
            req.flash('error', 'Usuário não autenticado');
            return res.redirect('/auth/cl-login');
        }
        try {
            await carrinhoController.limparCarrinhoInvalidos(req.user.ID_USUARIO);

            const [carrinho] = await db.query(`
                SELECT c.*, cur.TITULO, cur.PRECO, cur.IMAGEM, u.NOME_USU as NOME_PROFESSOR 
                FROM CARRINHO c 
                JOIN CURSOS cur ON c.ID_CURSO = cur.ID_CURSO 
                JOIN USUARIO u ON cur.ID_USUARIO = u.ID_USUARIO 
                WHERE c.ID_USUARIO = ? AND cur.TITULO IS NOT NULL AND cur.PRECO > 0
                ORDER BY c.DATA_ADICAO DESC`, 
                [req.user.ID_USUARIO]
            );
            res.render('dashboard/aluno/a-carrinho', { 
                user: req.user, 
                title: 'Meu Carrinho', 
                carrinho, 
                timestamp: Date.now() 
            });
        } catch (err) {
            console.error('Erro ao buscar carrinho:', err);
            req.flash('error', 'Erro ao carregar carrinho');
            res.redirect('/aluno/a-todososcursos');
        }
    },
    removerDoCarrinho: async (req, res) => {
        if (!req.user || !req.user.ID_USUARIO) {
            return res.status(401).json({ success: false, message: 'Usuário não autenticado' });
        }
        const { cursoId } = req.body;
        const userId = req.user.ID_USUARIO;
        try {
            await db.query('DELETE FROM CARRINHO WHERE ID_USUARIO = ? AND ID_CURSO = ?', [userId, cursoId]);
            res.json({ success: true, message: 'Curso removido do carrinho com sucesso' });
        } catch (err) {
            console.error('Erro ao remover do carrinho:', err);
            res.status(500).json({ success: false, message: 'Erro ao remover curso do carrinho' });
        }
    },
    criarPagamento: async (req, res) => {
        if (!req.user || !req.user.ID_USUARIO) {
            return res.status(401).json({ success: false, message: 'Usuário não autenticado' });
        }

        const userId = req.user.ID_USUARIO;
        const connection = await db.getConnection();

        try {
            await connection.beginTransaction();

            const [itensCarrinho] = await connection.query(`
                SELECT c.ID_CURSO, cur.PRECO, cur.TITULO, u.EMAIL, u.NOME_USU 
                FROM CARRINHO c 
                JOIN CURSOS cur ON c.ID_CURSO = cur.ID_CURSO 
                JOIN USUARIO u ON c.ID_USUARIO = u.ID_USUARIO 
                WHERE c.ID_USUARIO = ? AND cur.TITULO IS NOT NULL AND cur.PRECO > 0`, 
                [userId]
            );

            if (!itensCarrinho || itensCarrinho.length === 0) {
                await connection.rollback();
                return res.status(400).json({ success: false, message: 'Seu carrinho está vazio ou contém itens inválidos.' });
            }

            const valorTotal = itensCarrinho.reduce((total, item) => {
                const preco = parseFloat(item.PRECO) || 0;
                return total + preco;
            }, 0);

            if (isNaN(valorTotal) || valorTotal <= 0) {
                await connection.rollback();
                return res.status(400).json({ 
                    success: false, 
                    message: 'Erro ao calcular o valor total da compra.' 
                });
            }

            const [resultCompra] = await connection.query(
                'INSERT INTO COMPRA (ID_USUARIO, FORMA_PAGAMENTO, DATA_COMPRA, STATUS, VALOR) VALUES (?, ?, NOW(), 0, ?)',
                [userId, 'MERCADO_PAGO', valorTotal]
            );

            const compraId = resultCompra.insertId;

            const items = itensCarrinho
                .filter(item => item.TITULO && item.PRECO > 0)
                .map(item => ({
                    id: item.ID_CURSO.toString(),
                    title: item.TITULO,
                    unit_price: parseFloat(item.PRECO),
                    quantity: 1,
                    currency_id: 'BRL',
                    description: `Curso: ${item.TITULO}`
                }));

            if (items.length === 0) {
                await connection.rollback();
                return res.status(400).json({ 
                    success: false, 
                    message: 'Não foi possível processar os itens do carrinho.' 
                });
            }

            const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
            const urls = {
                success: new URL('/aluno/pagamento/sucesso', baseUrl).toString(),
                failure: new URL('/aluno/pagamento/falha', baseUrl).toString(),
                pending: new URL('/aluno/pagamento/pendente', baseUrl).toString(),
                notification: new URL('/aluno/webhook/mercadopago', baseUrl).toString()
            };

            const preferenceData = {
                items: items,
                payer: {
                    name: itensCarrinho[0].NOME_USU,
                    email: itensCarrinho[0].EMAIL
                },
                back_urls: {
                    success: urls.success,
                    failure: urls.failure,
                    pending: urls.pending
                },
                external_reference: compraId.toString(),
                notification_url: urls.notification,
                payment_methods: {
                    excluded_payment_types: [],
                    installments: 12,
                    default_installments: 1
                },
                statement_descriptor: 'CAPPU ENSINO',
                expires: true,
                expiration_date_from: new Date().toISOString(),
                expiration_date_to: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
            };

            console.log('Preference Data:', JSON.stringify(preferenceData, null, 2));

            try {
                const response = await preference.create({ body: preferenceData });
                console.log('Mercado Pago Response:', JSON.stringify(response, null, 2));
                
                const cursosCompraValues = itensCarrinho.map(item => [compraId, item.ID_CURSO]);
                await connection.query(
                    'INSERT INTO CURSOS_COMPRA (ID_COMPRA, ID_CURSO) VALUES ?',
                    [cursosCompraValues]
                );

                await connection.commit();

                res.json({
                    success: true,
                    init_point: response.init_point,
                    sandbox_init_point: response.sandbox_init_point,
                    preference_id: response.id
                });
            } catch (mpError) {
                console.error('Erro detalhado do Mercado Pago:', mpError);
                await connection.rollback();
                throw mpError;
            }

        } catch (err) {
            await connection.rollback();
            console.error('Erro ao criar pagamento:', err);
            res.status(500).json({
                success: false,
                message: 'Erro ao criar pagamento',
                error: err.message
            });
        } finally {
            connection.release();
        }
    },
    handleWebhook: async (req, res) => {
        const payment = req.query;
        try {
            if (payment.type === 'payment') {
                const data = await new Payment(client).get({ id: payment['data.id'] });
                const compraId = data.external_reference;
                const statusPagamento = data.status;
                const [compras] = await db.query('SELECT * FROM COMPRA WHERE ID_COMPRA = ?', [compraId]);
                if (!compras || compras.length === 0) {
                    return res.sendStatus(404);
                }
                const compra = compras[0];
                if (compra.STATUS !== 0) {
                    return res.sendStatus(200);
                }
                if (statusPagamento === 'approved') {
                    const connection = await db.getConnection();
                    try {
                        await connection.beginTransaction();
                        await connection.query('UPDATE COMPRA SET STATUS = 1, DATA_ATUALIZACAO = NOW() WHERE ID_COMPRA = ?', [compraId]);
                        await connection.query('DELETE FROM CARRINHO WHERE ID_USUARIO = ?', [compra.ID_USUARIO]);
                        await connection.commit();
                    } catch (error) {
                        await connection.rollback();
                    } finally {
                        connection.release();
                    }
                } else {
                    await db.query('UPDATE COMPRA SET STATUS = 2, DATA_ATUALIZACAO = NOW() WHERE ID_COMPRA = ?', [compraId]);
                }
            }
            res.sendStatus(200);
        } catch (error) {
            res.sendStatus(500);
        }
    }
};

module.exports = carrinhoController; 