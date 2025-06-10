const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const upload = require("../middleware/multer"); // Middleware para upload de arquivos
const db = require('../config/database'); // Importação do banco de dados
const carrinhoController = require('../controller/carrinhoController');

// Middleware para verificar se o usuário é aluno
const isAluno = (req, res, next) => {
  if (req.user && (req.user.role === "aluno" || req.user.TIPO_USUARIO === "aluno")) {
    return next();
  }
  req.flash('error', 'Acesso negado. Faça login como aluno.');
  res.redirect("/auth/cl-login");
};

router.use(isAluno); // Aplica o middleware a todas as rotas de aluno

// Dashboard do aluno
router.get("/", (req, res) => {
  res.render("dashboard/aluno/a-perfil", {
    user: req.user,
    title: "Dashboard Aluno",
  });
});

// Rota de Configurações do Aluno
router.get("/a-config", (req, res) => {
  res.render("dashboard/aluno/a-config", {
    user: req.user,
    title: "Configurações",
    success: req.flash('success'),
    error: req.flash('error'),
    timestamp: Date.now()
  });
});

// Excluir conta do usuário
router.post("/excluir-conta", async (req, res) => {
  // const db = require('../config/database'); // Já importado no topo do arquivo
  try {
    if (!req.user || !req.user.ID_USUARIO) {
        req.flash('error', 'Usuário não autenticado.');
        return res.redirect('/aluno/a-config');
    }
    console.log('Tentando excluir usuário:', req.user.ID_USUARIO);
    // Deleta dependências em FEYNMAN
    await db.query('DELETE FROM FEYNMAN WHERE ID_USUARIO = ?', [req.user.ID_USUARIO]);
    // Deleta dependências em QUEST_ANALISE
    await db.query('DELETE FROM QUEST_ANALISE WHERE ID_USUARIO = ?', [req.user.ID_USUARIO]);
    // Deleta dependências em ANALISE_APRENDIZAGEM
    await db.query('DELETE FROM ANALISE_APRENDIZAGEM WHERE ID_USUARIO = ?', [req.user.ID_USUARIO]);
    // Deleta dependências em MNEMONICAS
    await db.query('DELETE FROM MNEMONICAS WHERE ID_USUARIO = ?', [req.user.ID_USUARIO]);
    // Deleta dependências em RESUMOS
    await db.query('DELETE FROM RESUMOS WHERE ID_USUARIO = ?', [req.user.ID_USUARIO]);



    // Deleta dependências em FOTO_PERFIL (seta NULL)
    await db.query('UPDATE USUARIO SET FOTO_PERFIL = NULL WHERE ID_USUARIO = ?', [req.user.ID_USUARIO]);
    // Deleta o usuário do banco
    const [result] = await db.query('DELETE FROM USUARIO WHERE ID_USUARIO = ?', [req.user.ID_USUARIO]);
    console.log('Resultado da exclusão:', result);
    
    req.logout(function(err) {
      if (err) { 
        console.error('Erro no logout após exclusão:', err);
        req.flash('error', 'Erro ao fazer logout: ' + err.message);
        return res.redirect('/aluno/a-config'); 
      }
      req.session.destroy((err) => {
        if (err) {
            console.error('Erro ao destruir sessão:', err);
            req.flash('error', 'Erro ao finalizar sessão.');
            return res.redirect('/aluno/a-config');
        }
        res.clearCookie('connect.sid'); // Limpa o cookie da sessão
        res.redirect('/');
      });
    });
  } catch (err) {
    console.error('Erro ao excluir conta:', err);
    req.flash('error', 'Erro ao excluir conta: ' + err.message);
    res.redirect('/aluno/a-config');
  }
});

// Upload da foto do perfil
router.post("/upload-foto", upload.single("foto_perfil"), async (req, res) => {
  if (!req.file) {
    req.flash('error', 'Nenhum arquivo enviado!');
    return res.redirect("/aluno/a-config");
  }
  // const db = require('../config/database'); // Já importado
  try {
    if (!req.user || !req.user.ID_USUARIO) {
        req.flash('error', 'Usuário não autenticado para upload de foto.');
        return res.redirect("/aluno/a-config");
    }
    // Salva a imagem no banco
    await db.query(
      'UPDATE USUARIO SET FOTO_PERFIL = ? WHERE ID_USUARIO = ?',
      [req.file.buffer, req.user.ID_USUARIO]
    );
    // Recarrega o usuário atualizado do banco para atualizar a sessão
    const [rows] = await db.query('SELECT * FROM USUARIO WHERE ID_USUARIO = ?', [req.user.ID_USUARIO]);
    if (rows.length) {
      // Atualiza req.user para refletir a nova foto na sessão atual
      req.user.FOTO_PERFIL = rows[0].FOTO_PERFIL;
    }
    req.flash('success', 'Foto de perfil adicionada com sucesso!');
    res.redirect("/aluno/a-config");
  } catch (err) {
    console.error('Erro ao salvar foto no banco:', err);
    req.flash('error', 'Erro ao salvar foto no banco: ' + err.message);
    res.redirect("/aluno/a-config");
  }
});

// Excluir foto do perfil
router.post("/excluir-foto", async (req, res) => {
  // const db = require('../config/database'); // Já importado
  try {
    if (!req.user || !req.user.ID_USUARIO) {
        req.flash('error', 'Usuário não autenticado para exclusão de foto.');
        return res.redirect("/aluno/a-config");
    }
    await db.query('UPDATE USUARIO SET FOTO_PERFIL = NULL WHERE ID_USUARIO = ?', [req.user.ID_USUARIO]);
    if (req.user) { // Garante que req.user existe
        req.user.FOTO_PERFIL = null;
    }
    req.flash('success', 'Foto de perfil removida com sucesso!');
    res.redirect("/aluno/a-config");
  } catch (err) {
    console.error('Erro ao remover foto:', err);
    req.flash('error', 'Erro ao remover foto: ' + err.message);
    res.redirect("/aluno/a-config");
  }
});

// Rota para o Perfil do Aluno
router.get("/a-perfil", (req, res) => {
  res.render("dashboard/aluno/a-perfil", {
    user: req.user,
    title: "Perfil Aluno",
    timestamp: Date.now()
  });
});

// Rota para Meus Cursos
router.get("/a-meuscursos", (req, res) => {
  res.render("dashboard/aluno/a-meuscursos", {
    user: req.user,
    title: "Meus Cursos",
    timestamp: Date.now()
  });
});

router.get("/a-comprar-curso", (req, res) => {
  res.render("dashboard/aluno/a-comprar-curso", {
    user: req.user,
    title: "Todos os Cursos",
    timestamp: Date.now()
  });
});

router.get("/teste-header", (req, res) => {
  res.render("dashboard/aluno/teste-header", {
    user: req.user,
    title: "Teste Header",
    timestamp: Date.now()
  });
});


// Função utilitária para checar se o usuário já respondeu o VARK
async function usuarioRespondeuVark(userId) { // Removido o parâmetro 'query' pois db já está no escopo
  const [resultado] = await db.query( // Usando db diretamente
    "SELECT 1 FROM ANALISE_APRENDIZAGEM WHERE ID_USUARIO = ? LIMIT 1",
    [userId]
  );
  return resultado && resultado.length > 0;
}

// Rota Minha Rotina (verifica VARK)
router.get("/a-minha-rotina", async (req, res) => {
  if (!req.user || !req.user.ID_USUARIO) {
    req.flash('error', 'Usuário não autenticado.');
    return res.redirect('/auth/cl-login');
  }
  const userId = req.user.ID_USUARIO;
  try {
    const respondeu = await usuarioRespondeuVark(userId);
    if (respondeu) {
      return res.redirect("/aluno/a-minha-rotina-2");
    }
    res.render("dashboard/aluno/a-minha-rotina", {
      user: req.user,
      title: "Minha Rotina",
      timestamp: Date.now()
    });
  } catch (err) {
      console.error("Erro ao verificar VARK:", err);
      req.flash('error', 'Erro ao carregar a página Minha Rotina.');
      res.redirect('/aluno/a-perfil');
  }
});

// Rota Pomodoro
router.get("/a-pomodoro", (req, res) => {
  res.render("dashboard/aluno/a-pomodoro", {
    user: req.user,
    title: "Pomodoro",
    timestamp: Date.now()
  });
});

// Rota para criar/editar Resumo
router.get("/a-resumo", (req, res) => { // Para novo resumo
  res.render("dashboard/aluno/a-resumo", {
    user: req.user,
    resumo: null, // Indica que é um novo resumo
    title: "Novo Resumo",
    timestamp: Date.now()
  });
});

// Rota para editar resumo existente
router.get('/a-resumo/:id', async (req, res) => {
    if (!req.user || !req.user.ID_USUARIO) {
        req.flash('error', 'Usuário não autenticado.');
        return res.redirect('/auth/cl-login');
    }
    try {
        const [rows] = await db.query('SELECT * FROM RESUMOS WHERE COD_RESUMO = ? AND ID_USUARIO = ?', [req.params.id, req.user.ID_USUARIO]);
        if (rows.length === 0) {
            req.flash('error', 'Resumo não encontrado.');
            return res.redirect('/aluno/a-bd_resumos');
        }
        res.render('dashboard/aluno/a-resumo', {
            user: req.user,
            resumo: rows[0],
            title: 'Editar Resumo',
            timestamp: Date.now()
        });
    } catch (err) {
        console.error("Erro ao buscar resumo para edição:", err);
        req.flash('error', 'Erro ao carregar resumo para edição.');
        res.redirect('/aluno/a-bd_resumos');
    }
});

// Salvar novo resumo ou atualizar existente
router.post('/a-resumo', async (req, res) => { // Rota unificada para criar e atualizar
    if (!req.user || !req.user.ID_USUARIO) {
        req.flash('error', 'Usuário não autenticado.');
        return res.status(403).redirect('/auth/cl-login');
    }
    const { titulo, categoria, texto_resumo, cod_resumo } = req.body; // cod_resumo virá do form se for edição
    const userId = req.user.ID_USUARIO;

    try {
        if (cod_resumo) { // Se tem cod_resumo, é uma atualização
            await db.query(
                'UPDATE RESUMOS SET TEXTO_RESUMO = ?, TITULO = ?, CATEGORIA = ?, DATA_RESUMO = NOW() WHERE COD_RESUMO = ? AND ID_USUARIO = ?',
                [texto_resumo, titulo, categoria, cod_resumo, userId]
            );
            req.flash('success', 'Resumo atualizado com sucesso!');
            res.redirect(`/aluno/a-page-resumo/${cod_resumo}`);
        } else { // Senão, é uma criação
            const [result] = await db.query(
                'INSERT INTO RESUMOS (ID_USUARIO, DATA_RESUMO, TEXTO_RESUMO, TITULO, CATEGORIA) VALUES (?, NOW(), ?, ?, ?)',
                [userId, texto_resumo, titulo, categoria]
            );
            req.flash('success', 'Resumo criado com sucesso!');
            res.redirect(`/aluno/a-page-resumo/${result.insertId}`);
        }
    } catch (err) {
        console.error("Erro ao salvar resumo:", err);
        req.flash('error', 'Erro ao salvar resumo.');
        res.redirect(cod_resumo ? `/aluno/a-resumo/${cod_resumo}` : '/aluno/a-resumo');
    }
});


// Rota para Mnemônica (novo)
router.get('/a-mnemonica', (req, res) => {
  res.render('dashboard/aluno/a-mnemonica', {
    user: req.user,
    mnemonica: null,
    title: 'Nova Mnemônica',
    timestamp: Date.now()
  });
});

// Salvar nova mnemônica ou atualizar existente
router.post('/a-mnemonica', require('../middleware/multer').single('imagem'), async (req, res) => { // Rota unificada
    if (!req.user || !req.user.ID_USUARIO) {
        req.flash('error', 'Usuário não autenticado.');
        return res.status(403).redirect('/auth/cl-login');
    }
    const { titulo, categoria, texto_mnemonica, cod_mnemonica } = req.body;
    const userId = req.user.ID_USUARIO;

    try {
        if (cod_mnemonica) { // Atualização
            let updateQuery = 'UPDATE MNEMONICAS SET TEXTO_MNEMONICA = ?, TITULO = ?, CATEGORIA = ?, DATA_MNEMONICA = NOW()';
            let params = [texto_mnemonica, titulo, categoria];
            if (req.file) {
                updateQuery += ', IMAGEM = ?';
                params.push(req.file.buffer);
            }
            updateQuery += ' WHERE COD_MNEMONICA = ? AND ID_USUARIO = ?';
            params.push(cod_mnemonica, userId);
            await db.query(updateQuery, params);
            req.flash('success', 'Mnemônica atualizada com sucesso!');
            res.redirect(`/aluno/a-page-mnemonica/${cod_mnemonica}`);
        } else { // Criação
            const [result] = await db.query(
                'INSERT INTO MNEMONICAS (ID_USUARIO, DATA_MNEMONICA, TEXTO_MNEMONICA, TITULO, CATEGORIA, IMAGEM) VALUES (?, NOW(), ?, ?, ?, ?)',
                [userId, texto_mnemonica, titulo, categoria, req.file ? req.file.buffer : null]
            );
            req.flash('success', 'Mnemônica criada com sucesso!');
            res.redirect(`/aluno/a-page-mnemonica/${result.insertId}`);
        }
    } catch (err) {
        console.error("Erro ao salvar mnemônica:", err);
        req.flash('error', 'Erro ao salvar mnemônica.');
        res.redirect(cod_mnemonica ? `/aluno/a-mnemonica/${cod_mnemonica}` : '/aluno/a-mnemonica');
    }
});

// Formulário para editar mnemônica
router.get('/a-mnemonica/:id', async (req, res) => {
  if (!req.user || !req.user.ID_USUARIO) {
    req.flash('error', 'Usuário não autenticado.');
    return res.redirect('/auth/cl-login');
  }
  try {
    const [rows] = await db.query('SELECT * FROM MNEMONICAS WHERE COD_MNEMONICA = ? AND ID_USUARIO = ?', [req.params.id, req.user.ID_USUARIO]);
    if (rows.length === 0) {
        req.flash('error', 'Mnemônica não encontrada.');
        return res.redirect('/aluno/a-bd_mnemonicas');
    }
    res.render('dashboard/aluno/a-mnemonica', {
      user: req.user,
      mnemonica: rows[0],
      title: 'Editar Mnemônica',
      timestamp: Date.now()
    });
  } catch (err) {
    console.error("Erro ao buscar mnemônica para edição:", err);
    req.flash('error', 'Erro ao carregar mnemônica.');
    res.redirect('/aluno/a-bd_mnemonicas');
  }
});

// Deletar mnemônica
router.post('/a-mnemonica/:id/delete', async (req, res) => {
  if (!req.user || !req.user.ID_USUARIO) {
    req.flash('error', 'Usuário não autenticado.');
    return res.redirect('/auth/cl-login');
  }
  try {
    await db.query('DELETE FROM MNEMONICAS WHERE COD_MNEMONICA = ? AND ID_USUARIO = ?', [req.params.id, req.user.ID_USUARIO]);
    req.flash('success', 'Mnemônica deletada com sucesso!');
    res.redirect('/aluno/a-bd_mnemonicas');
  } catch (err) {
    console.error("Erro ao deletar mnemônica:", err);
    req.flash('error', 'Erro ao deletar mnemônica.');
    res.redirect('/aluno/a-bd_mnemonicas');
  }
});

// Visualizar mnemônica específica
router.get('/a-page-mnemonica/:id', async (req, res) => {
  if (!req.user || !req.user.ID_USUARIO) {
    req.flash('error', 'Usuário não autenticado.');
    return res.redirect('/auth/cl-login');
  }
  try {
    const [rows] = await db.query('SELECT * FROM MNEMONICAS WHERE COD_MNEMONICA = ? AND ID_USUARIO = ?', [req.params.id, req.user.ID_USUARIO]);
    if (rows.length === 0) {
        req.flash('error', 'Mnemônica não encontrada.');
        return res.redirect('/aluno/a-bd_mnemonicas');
    }
    res.render('dashboard/aluno/a-page-mnemonica', {
      user: req.user,
      title: 'Página da Mnemônica',
      timestamp: Date.now(),
      mnemonica: rows[0]
    });
  } catch (err) {
    console.error("Erro ao buscar mnemônica:", err);
    req.flash('error', 'Erro ao carregar mnemônica.');
    res.redirect('/aluno/a-bd_mnemonicas');
  }
});

// Rota para servir imagem da mnemônica
router.get('/mnemonica-imagem/:id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT IMAGEM FROM MNEMONICAS WHERE COD_MNEMONICA = ?', [req.params.id]);
    if (rows.length && rows[0].IMAGEM) {
      res.set('Content-Type', 'image/jpeg');
      res.send(rows[0].IMAGEM);
    } else {
      res.status(404).send('Imagem não encontrada');
    }
  } catch (err) {
    res.status(500).send('Erro ao carregar imagem');
  }
});

// Rota Feynman
router.get("/a-feynman", (req, res) => {
  res.render("dashboard/aluno/a-feynman", {
    user: req.user,
    feynman: null, // Corrige ReferenceError no EJS
    title: "Feynman",
    timestamp: Date.now()
  });
});

// Visualizar Feynman específico
router.get('/a-page-feynman/:id', async (req, res) => {
  if (!req.user || !req.user.ID_USUARIO) {
    req.flash('error', 'Usuário não autenticado.');
    return res.redirect('/auth/cl-login');
  }
  try {
    const [rows] = await db.query('SELECT * FROM FEYNMAN WHERE COD_FEYNMAN = ? AND ID_USUARIO = ?', [req.params.id, req.user.ID_USUARIO]);
    if (rows.length === 0) {
      req.flash('error', 'Feynman não encontrado.');
      return res.redirect('/aluno/a-bd_feynman');
    }
    res.render('dashboard/aluno/a-page-feynman', {
      user: req.user,
      feynman: rows[0],
      title: 'Página do Feynman',
      timestamp: Date.now()
    });
  } catch (err) {
    console.error("Erro ao buscar Feynman:", err);
    req.flash('error', 'Erro ao carregar Feynman.');
    res.redirect('/aluno/a-bd_feynman');
  }
});

// Formulário para editar Feynman existente
router.get('/a-feynman/:id', async (req, res) => {
  if (!req.user || !req.user.ID_USUARIO) {
    req.flash('error', 'Usuário não autenticado.');
    return res.redirect('/auth/cl-login');
  }
  try {
    const [rows] = await db.query('SELECT * FROM FEYNMAN WHERE COD_FEYNMAN = ? AND ID_USUARIO = ?', [req.params.id, req.user.ID_USUARIO]);
    if (rows.length === 0) {
      req.flash('error', 'Feynman não encontrado.');
      return res.redirect('/aluno/a-bd_feynman');
    }
    res.render('dashboard/aluno/a-feynman', {
      user: req.user,
      feynman: rows[0],
      title: 'Editar Feynman',
      timestamp: Date.now()
    });
  } catch (err) {
    console.error("Erro ao buscar Feynman para edição:", err);
    req.flash('error', 'Erro ao carregar Feynman para edição.');
    res.redirect('/aluno/a-bd_feynman');
  }
});

// Deletar Feynman
router.post('/a-feynman/:id/delete', async (req, res) => {
  if (!req.user || !req.user.ID_USUARIO) {
    req.flash('error', 'Usuário não autenticado.');
    return res.redirect('/auth/cl-login');
  }
  try {
    await db.query('DELETE FROM FEYNMAN WHERE COD_FEYNMAN = ? AND ID_USUARIO = ?', [req.params.id, req.user.ID_USUARIO]);
    req.flash('success', 'Feynman deletado com sucesso!');
    res.redirect('/aluno/a-bd_feynman');
  } catch (err) {
    console.error("Erro ao deletar Feynman:", err);
    req.flash('error', 'Erro ao deletar Feynman.');
    res.redirect('/aluno/a-bd_feynman');
  }
});

// Salvar novo Feynman ou atualizar existente
router.post('/a-feynman', async (req, res) => {
  if (!req.user || !req.user.ID_USUARIO) {
    req.flash('error', 'Usuário não autenticado.');
    return res.status(403).redirect('/auth/cl-login');
  }
  const { titulo, texto_feynman, cod_feynman } = req.body;
  const userId = req.user.ID_USUARIO;

  try {
    if (cod_feynman) {
      // Atualizar existente
      await db.query(
        'UPDATE FEYNMAN SET TITULO = ?, TEXTO_FEYNMAN = ?, DATA_FEYNMAN = NOW() WHERE COD_FEYNMAN = ? AND ID_USUARIO = ?',
        [titulo, texto_feynman, cod_feynman, userId]
      );
      req.flash('success', 'Feynman atualizado com sucesso!');
      res.redirect('/aluno/a-bd_feynman');
    } else {
      // Criar novo
      await db.query(
        'INSERT INTO FEYNMAN (ID_USUARIO, TITULO, TEXTO_FEYNMAN, DATA_FEYNMAN) VALUES (?, ?, ?, NOW())',
        [userId, titulo, texto_feynman]
      );
      req.flash('success', 'Feynman criado com sucesso!');
      res.redirect('/aluno/a-bd_feynman');
    }
  } catch (err) {
    console.error("Erro ao salvar Feynman:", err);
    req.flash('error', 'Erro ao salvar Feynman.');
    res.redirect(cod_feynman ? `/aluno/a-feynman/${cod_feynman}` : '/aluno/a-feynman');
  }
});

// Rota Banco de Dados Feynman
router.get("/a-bd_feynman", async (req, res) => {
  if (!req.user || !req.user.ID_USUARIO) {
    req.flash('error', 'Usuário não autenticado.');
    return res.redirect('/auth/cl-login');
  }
  try {
    const [feynmans] = await db.query('SELECT * FROM FEYNMAN WHERE ID_USUARIO = ?', [req.user.ID_USUARIO]);
    res.render("dashboard/aluno/a-bd_feynman", {
      user: req.user,
      feynmans: feynmans || [],
      title: "Feynman - Salvos",
      timestamp: Date.now()
    });
  } catch (err) {
    console.error("Erro ao buscar Feynmans:", err);
    req.flash('error', 'Erro ao carregar Feynmans.');
    res.redirect('/aluno/a-perfil');
  }
});

// Listar todas as mnemônicas do usuário
router.get('/a-bd_mnemonicas', async (req, res) => {
  if (!req.user || !req.user.ID_USUARIO) {
    req.flash('error', 'Usuário não autenticado.');
    return res.redirect('/auth/cl-login');
  }
  try {
    const [mnemonicas] = await db.query('SELECT * FROM MNEMONICAS WHERE ID_USUARIO = ?', [req.user.ID_USUARIO]);
    res.render('dashboard/aluno/a-bd_mnemonicas', {
      user: req.user,
      mnemonicas: mnemonicas || [],
      title: 'Minhas Mnemônicas',
      timestamp: Date.now()
    });
  } catch (err) {
    console.error("Erro ao buscar mnemônicas:", err);
    req.flash('error', 'Erro ao carregar mnemônicas.');
    res.redirect('/aluno/a-perfil');
  }
});

// Rota Banco de Dados Resumos
router.get("/a-bd_resumos", async (req, res) => {
  if (!req.user || !req.user.ID_USUARIO) {
    req.flash('error', 'Usuário não autenticado.');
    return res.redirect('/auth/cl-login');
  }
  try {
    const [resumos] = await db.query("SELECT * FROM RESUMOS WHERE ID_USUARIO = ?", [req.user.ID_USUARIO]);
    res.render("dashboard/aluno/a-bd_resumos", {
      user: req.user,
      title: "Meus Resumos",
      timestamp: Date.now(),
      resumos: resumos || []
    });
  } catch (err) {
    console.error("Erro ao buscar resumos:", err);
    req.flash('error', 'Erro ao carregar resumos.');
    res.redirect("/aluno/a-perfil");
  }
});


// Rota para Meus Materiais
router.get("/a-meusmateriais", (req, res) => {
  // Lógica para buscar materiais se necessário
  res.render("dashboard/aluno/a-meusmateriais", {
    user: req.user,
    title: "Meus Materiais",
    timestamp: Date.now()
    // Passar dados dos materiais aqui, ex: materiais: resultadosDoBanco
  });
});

router.get("/a-meusmateriais2", (req, res) => {
  // Lógica para buscar materiais se necessário
  res.render("dashboard/aluno/a-meusmateriais2", {
    user: req.user,
    title: "Meus Materiais",
    timestamp: Date.now()
    // Passar dados dos materiais aqui, ex: materiais: resultadosDoBanco
  });
});

// Rota para Gerenciar Plano
router.get("/a-gerenciarplano", (req,res) =>{
  res.render("dashboard/aluno/a-gerenciarplano",{
    user: req.user,
    title: "Gerenciar Plano",
    timestamp: Date.now()
  });
});

// Visualizar resumo específico
router.get("/a-page-resumo/:id", async (req, res) => {
  if (!req.user || !req.user.ID_USUARIO) {
    req.flash('error', 'Usuário não autenticado.');
    return res.redirect('/auth/cl-login');
  }
  try {
    const [rows] = await db.query(
      'SELECT * FROM RESUMOS WHERE COD_RESUMO = ? AND ID_USUARIO = ?',
      [req.params.id, req.user.ID_USUARIO]
    );
    if (rows.length === 0) {
        req.flash('error', 'Resumo não encontrado.');
        return res.redirect('/aluno/a-bd_resumos');
    }
    res.render("dashboard/aluno/a-page-resumo", {
      user: req.user,
      title: "Página de Resumo",
      timestamp: Date.now(),
      resumo: rows[0]
    });
  } catch (err) {
    console.error("Erro ao buscar resumo:", err);
    req.flash('error', 'Erro ao carregar resumo.');
    res.redirect('/aluno/a-bd_resumos');
  }
});

// Deletar resumo
router.post('/a-resumo/:id/delete', async (req, res) => {
    if (!req.user || !req.user.ID_USUARIO) {
        req.flash('error', 'Usuário não autenticado.');
        return res.redirect('/auth/cl-login');
    }
    try {
        await db.query('DELETE FROM RESUMOS WHERE COD_RESUMO = ? AND ID_USUARIO = ?', [req.params.id, req.user.ID_USUARIO]);
        req.flash('success', 'Resumo deletado com sucesso!');
        res.redirect('/aluno/a-bd_resumos');
    } catch (err) {
        console.error("Erro ao deletar resumo:", err);
        req.flash('error', 'Erro ao deletar resumo.');
        res.redirect('/aluno/a-bd_resumos');
    }
});

// Rota TODOS OS CURSOS - CORRIGIDA
router.get("/a-todososcursos", async (req, res) => {
  if (!req.user) {
    req.flash('error', 'Usuário não autenticado.');
    return res.redirect('/auth/cl-login');
  }
  try {
    const [cursosDB] = await db.query(`
      SELECT c.ID_CURSO, c.TITULO, c.DESCRICAO, u.NOME_USU as NOME_PROFESSOR, c.PRECO, c.OBJETIVOS, c.DURACAO_TOTAL
      FROM CURSOS c
      JOIN USUARIO u ON c.ID_USUARIO = u.ID_USUARIO
      WHERE u.TIPO_USUARIO = 'professor' 
    `); // Adicionei mais campos para exibição

    res.render("dashboard/aluno/a-todososcursos", {
      user: req.user,
      title: "Todos os Cursos",
      cursos: cursosDB || [], // Garante que 'cursos' seja um array, mesmo que vazio
      timestamp: Date.now()
    });
  } catch (err) {
    console.error('Erro ao buscar todos os cursos:', err);
    req.flash('error', 'Não foi possível carregar os cursos.');
    res.redirect('/aluno/a-perfil');
  }
});

// Rota para Certificados
router.get("/a-certificado", (req,res) => {
  res.render("dashboard/aluno/a-certificado", {
    user : req.user,
    title : "Certificados",
    timestamp: Date.now()
  });
});

// Rota para Aula
router.get("/aula", (req,res) => {
  res.render("dashboard/aluno/aula", {
    user : req.user,
    title : "Aula",
    timestamp: Date.now()
  });
});

// Rota para Aula Card
router.get("/aula-card", (req,res) => {
  res.render("dashboard/aluno/aula-card", {
    user : req.user,
    title : "Aula Concluída",
    timestamp: Date.now()
  });
});

// Rota para Exercício
router.get("/exercicio", (req,res) => {
  res.render("dashboard/aluno/exercicio", {
    user : req.user,
    title : "Exercício",
    timestamp: Date.now()
  });
});

// Rota para Avaliar Curso
router.get("/a-avaliar", (req,res) => {
  res.render("dashboard/aluno/a-avaliar", {
    user : req.user,
    title : "Avaliar Curso",
    timestamp: Date.now()
  });
});

// Rotas para Questionário VARK
router.get("/quest1_vark", (req,res) => {
  res.render("dashboard/aluno/quest1_vark", {
    user : req.user,
    title : "Questionário Vark - Parte 1",
    timestamp: Date.now()
  });
});

router.get("/quest2_vark", (req,res) => {
  res.render("dashboard/aluno/quest2_vark", {
    user : req.user,
    title : "Questionário Vark - Parte 2",
    timestamp: Date.now()
  });
});

router.get("/quest3_vark", (req,res) => {
  res.render("dashboard/aluno/quest3_vark", {
    user : req.user,
    title : "Questionário Vark - Parte 3",
    timestamp: Date.now()
  });
});

router.get("/quest4_vark", (req,res) => {
  res.render("dashboard/aluno/quest4_vark", {
    user : req.user,
    title : "Questionário Vark - Parte 4",
    timestamp: Date.now()
  });
});

const varkController = require("../controller/varkController");

// Salvar respostas do questionário VARK
router.post("/vark/save", varkController.salvarRespostasVark);

// Endpoint para checar se o usuário já respondeu o VARK
router.get("/vark/respondido", async (req, res) => {
  if (!req.user || !req.user.ID_USUARIO) {
    return res.status(403).json({ respondido: false, error: 'Usuário não autenticado.' });
  }
  const userId = req.user.ID_USUARIO;
  try {
    const respondeu = await usuarioRespondeuVark(userId); // Usando a função utilitária
    res.json({ respondido });
  } catch (err) {
    console.error("Erro ao verificar status do VARK:", err);
    res.status(500).json({ respondido: false, error: err.message });
  }
});

// Mostrar o resultado VARK na tela de conclusão
router.get("/conclusao", varkController.resultadoVark);

// Rota para Minha Rotina (pós-VARK)
router.get("/a-minha-rotina-2", (req,res) => {
  res.render("dashboard/aluno/a-minha-rotina-2", {
    user : req.user,
    timestamp: Date.now(),
    title : "Minha Rotina Personalizada",
  });
});

// Rota para a Home (genérica, verificar se precisa estar aqui ou em home.js)
router.get("/cursos", (req,res) => {
  res.render("pages/home/cursos"); // Renderiza uma página genérica de cursos, não os cursos do aluno
});


// Rota para salvar avaliação (POST)
router.post("/avaliar/save", (req, res) => {
  // Lógica para salvar avaliação
  // Ex: const { nota, justificativa, id_curso } = req.body;
  // Salvar no banco de dados
  req.flash('success', 'Avaliação enviada com sucesso!');
  res.redirect('/aluno/a-meuscursos'); // ou para a página do curso avaliado
});

// Rota para exibir foto do perfil
router.get('/foto-perfil/:id', async (req, res) => {
  // const db = require('../config/database'); // Já importado
  try {
    const [rows] = await db.query('SELECT FOTO_PERFIL FROM USUARIO WHERE ID_USUARIO = ?', [req.params.id]);
    if (!rows.length || !rows[0].FOTO_PERFIL) {
      // Se não houver foto ou usuário, envia uma imagem padrão
      return res.sendFile(path.join(__dirname, '../../public/images/icons/perfil.svg')); // Ajuste o caminho para sua imagem padrão
    }
    res.set('Content-Type', 'image/jpeg'); // Ou o mimetype correto da imagem
    res.send(rows[0].FOTO_PERFIL);
  } catch (err) {
    console.error("Erro ao buscar foto de perfil:", err);
    res.sendFile(path.join(__dirname, '../../public/images/icons/perfil.svg')); // Imagem padrão em caso de erro
  }
});

// Rota de logout para destruir a sessão do usuário
router.get('/logout', (req, res, next) => {
    req.logout(function(err) {
      if (err) { 
        console.error('Erro no logout do aluno:', err);
        return next(err); 
      }
      req.session.destroy((err) => {
        if (err) {
            console.error('Erro ao destruir sessão no logout do aluno:', err);
            return next(err);
        }
        res.clearCookie('connect.sid'); // Limpa o cookie da sessão
        res.redirect('/'); // Redireciona para a home page
      });
    });
});

// Rota para adicionar curso ao carrinho
router.post('/api/carrinho/adicionar', carrinhoController.adicionarAoCarrinho);

// Rota para obter contador do carrinho
router.get('/api/carrinho/contador', carrinhoController.getContadorCarrinho);

// Rotas do carrinho
router.get('/carrinho', carrinhoController.getCarrinho);
router.post('/api/carrinho/remover', carrinhoController.removerDoCarrinho);
router.post('/api/carrinho/finalizar', carrinhoController.finalizarCompra);

module.exports = router;
