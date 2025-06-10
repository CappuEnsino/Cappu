const db = require('../config/database');

const carrinhoController = {
    adicionarAoCarrinho: async (req, res) => {
        console.log('Tentando adicionar ao carrinho:', {
            userId: req.user?.ID_USUARIO,
            cursoId: req.body.cursoId,
            body: req.body
        });

        if (!req.user || !req.user.ID_USUARIO) {
            console.log('Erro: Usuário não autenticado');
            return res.status(401).json({
                success: false,
                message: 'Usuário não autenticado'
            });
        }

        const { cursoId } = req.body;
        const userId = req.user.ID_USUARIO;

        if (!cursoId) {
            console.log('Erro: ID do curso não fornecido');
            return res.status(400).json({
                success: false,
                message: 'ID do curso não fornecido'
            });
        }

        try {
            // Verificar se o curso existe
            const [cursos] = await db.query(
                'SELECT * FROM CURSOS WHERE ID_CURSO = ?',
                [cursoId]
            );

            console.log('Busca do curso:', { cursoId, cursoEncontrado: cursos?.length > 0 });

            if (!cursos || cursos.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Curso não encontrado'
                });
            }

            // Verificar se o curso já está no carrinho
            const [itensCarrinho] = await db.query(
                'SELECT * FROM CARRINHO WHERE ID_USUARIO = ? AND ID_CURSO = ?',
                [userId, cursoId]
            );

            console.log('Verificação do carrinho:', { 
                userId, 
                cursoId, 
                jaNoCarrinho: itensCarrinho?.length > 0 
            });

            if (itensCarrinho && itensCarrinho.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Curso já está no carrinho'
                });
            }

            // Verificar se o usuário já comprou o curso
            const [compras] = await db.query(
                'SELECT * FROM CURSOS_COMPRA cc JOIN COMPRA c ON cc.ID_COMPRA = c.ID_COMPRA WHERE c.ID_USUARIO = ? AND cc.ID_CURSO = ?',
                [userId, cursoId]
            );

            console.log('Verificação de compras:', { 
                userId, 
                cursoId, 
                jaComprado: compras?.length > 0 
            });

            if (compras && compras.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Você já possui este curso'
                });
            }

            // Adicionar ao carrinho
            const [result] = await db.query(
                'INSERT INTO CARRINHO (ID_USUARIO, ID_CURSO, DATA_ADICAO) VALUES (?, ?, NOW())',
                [userId, cursoId]
            );

            console.log('Resultado da inserção:', { 
                success: true, 
                insertId: result.insertId 
            });

            res.json({
                success: true,
                message: 'Curso adicionado ao carrinho com sucesso',
                data: {
                    carrinhoId: result.insertId
                }
            });

        } catch (err) {
            console.error('Erro detalhado ao adicionar ao carrinho:', {
                error: err,
                message: err.message,
                code: err.code,
                sqlMessage: err.sqlMessage
            });
            
            res.status(500).json({
                success: false,
                message: 'Erro ao adicionar curso ao carrinho',
                error: process.env.NODE_ENV === 'development' ? err.message : undefined
            });
        }
    },

    getContadorCarrinho: async (req, res) => {
        if (!req.user || !req.user.ID_USUARIO) {
            return res.status(401).json({
                success: false,
                message: 'Usuário não autenticado'
            });
        }

        try {
            const [result] = await db.query(
                'SELECT COUNT(*) as quantidade FROM CARRINHO WHERE ID_USUARIO = ?',
                [req.user.ID_USUARIO]
            );

            res.json({
                success: true,
                quantidade: result[0].quantidade
            });
        } catch (err) {
            console.error('Erro ao obter contador do carrinho:', err);
            res.status(500).json({
                success: false,
                message: 'Erro ao obter quantidade de itens no carrinho'
            });
        }
    },

    getCarrinho: async (req, res) => {
        if (!req.user || !req.user.ID_USUARIO) {
            req.flash('error', 'Usuário não autenticado');
            return res.redirect('/auth/cl-login');
        }

        try {
            const [carrinho] = await db.query(`
                SELECT c.*, cur.TITULO, cur.PRECO, u.NOME_USU as NOME_PROFESSOR 
                FROM CARRINHO c
                JOIN CURSOS cur ON c.ID_CURSO = cur.ID_CURSO
                JOIN USUARIO u ON cur.ID_USUARIO = u.ID_USUARIO
                WHERE c.ID_USUARIO = ?
                ORDER BY c.DATA_ADICAO DESC
            `, [req.user.ID_USUARIO]);

            res.render('dashboard/aluno/a-carrinho', {
                user: req.user,
                title: 'Meu Carrinho',
                carrinho: carrinho,
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
            return res.status(401).json({
                success: false,
                message: 'Usuário não autenticado'
            });
        }

        const { cursoId } = req.body;
        const userId = req.user.ID_USUARIO;

        try {
            await db.query(
                'DELETE FROM CARRINHO WHERE ID_USUARIO = ? AND ID_CURSO = ?',
                [userId, cursoId]
            );

            res.json({
                success: true,
                message: 'Curso removido do carrinho com sucesso'
            });
        } catch (err) {
            console.error('Erro ao remover do carrinho:', err);
            res.status(500).json({
                success: false,
                message: 'Erro ao remover curso do carrinho'
            });
        }
    },

    finalizarCompra: async (req, res) => {
        if (!req.user || !req.user.ID_USUARIO) {
            return res.status(401).json({
                success: false,
                message: 'Usuário não autenticado'
            });
        }

        const userId = req.user.ID_USUARIO;

        try {
            // Iniciar transação
            await db.query('START TRANSACTION');

            // Buscar itens do carrinho
            const [itensCarrinho] = await db.query(`
                SELECT c.*, cur.PRECO 
                FROM CARRINHO c
                JOIN CURSOS cur ON c.ID_CURSO = cur.ID_CURSO
                WHERE c.ID_USUARIO = ?
            `, [userId]);

            if (!itensCarrinho || itensCarrinho.length === 0) {
                await db.query('ROLLBACK');
                return res.status(400).json({
                    success: false,
                    message: 'Carrinho vazio'
                });
            }

            // Calcular valor total
            const valorTotal = itensCarrinho.reduce((total, item) => total + parseFloat(item.PRECO), 0);

            // Criar registro de compra
            const [resultCompra] = await db.query(
                'INSERT INTO COMPRA (ID_USUARIO, FORMA_PAGAMENTO, DATA_COMPRA, STATUS, VALOR) VALUES (?, ?, NOW(), 1, ?)',
                [userId, 'PIX', valorTotal]
            );

            const compraId = resultCompra.insertId;

            // Adicionar cursos à compra
            for (const item of itensCarrinho) {
                await db.query(
                    'INSERT INTO CURSOS_COMPRA (ID_COMPRA, ID_CURSO) VALUES (?, ?)',
                    [compraId, item.ID_CURSO]
                );
            }

            // Limpar carrinho
            await db.query('DELETE FROM CARRINHO WHERE ID_USUARIO = ?', [userId]);

            // Confirmar transação
            await db.query('COMMIT');

            res.json({
                success: true,
                message: 'Compra finalizada com sucesso'
            });
        } catch (err) {
            await db.query('ROLLBACK');
            console.error('Erro ao finalizar compra:', err);
            res.status(500).json({
                success: false,
                message: 'Erro ao finalizar compra'
            });
        }
    }
};

module.exports = carrinhoController; 