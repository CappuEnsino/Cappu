const express = require("express");
const router = express.Router();
const upload = require("../config/multer");
const professorController = require("../controller/professorController");
const db = require("../config/database");
const multer = require("multer");

// Dashboard do professor
router.get("/p-professor", (req, res) => {
  res.render("dashboard/professor/p-professor", {
    user: req.user,
    title: "Dashboard Professor",
    timestamp: Date.now(),
    success: req.flash('success'),
    error: req.flash('error')
  });
});

router.get("/p-config", async (req, res) => {
  let dadosBancarios = {};
  try {
    const [rows] = await db.query(
      "SELECT CONTA_PAG, AGENCIA_PAG, CHAVE_PIX, BANCO_PAG FROM CONFIG_PROF WHERE ID_USUARIO = ?",
      [req.user.ID_USUARIO]
    );
    if (rows.length > 0) {
      dadosBancarios = rows[0];
    }
  } catch (err) {
    console.error("Erro ao buscar dados bancários:", err);
  }
  res.render("dashboard/professor/p-config", {
    user: req.user,
    dadosBancarios,
    title: "Configurações",
    timestamp: Date.now(),
    success: req.flash('success'),
    error: req.flash('error')
  });
});

router.get("/p-minha-rotina", (req, res) => {
  res.render("dashboard/professor/p-minha-rotina", {
    user: req.user,
    title: "Minha Rotina",
    timestamp: Date.now(),
    success: req.flash('success'),
    error: req.flash('error')
  });
});

router.get("/p_gere_curso", (req, res) => {
  res.render("dashboard/professor/p_gere_curso", {
    user: req.user,
    title: "Gerenciar Cursos",
  });
});

// Rota para editar curso pelo ID
router.get("/p_gere_curso/:id", professorController.getCursoById);
// Rota para atualizar curso pelo ID
router.post(
  "/p_gere_curso/:id",
  upload.single("imagem"),
  professorController.updateCursoById
);
router.get("/p-curso_prof", professorController.listarCursosProfessor);

// Rota para criar/editar aula
router.get("/p-criar_aula", professorController.getCriarAulaPage);

// Rota para salvar aula (POST)
router.post("/p-criar_aula", upload.single("video_arquivo"), async (req, res) => {
  try {
    const {
      titulo,
      descricao,
      modulo_id,
      aula_id,
      duracao,
      ordem,
      tipo_conteudo,
      video_url,
    } = req.body;

    // Validação
    if (!titulo || !descricao || !modulo_id) {
      return res.status(400).json({
        success: false,
        message: "Preencha todos os campos obrigatórios!",
      });
    }

    const [modulos] = await db.query(
      `SELECT m.ID_CURSO FROM MODULO m 
       JOIN CURSOS c ON m.ID_CURSO = c.ID_CURSO 
       WHERE m.ID_MODULO = ? AND c.ID_USUARIO = ?`,
      [modulo_id, req.user.ID_USUARIO]
    );

    if (!modulos || modulos.length === 0) {
      return res.status(403).json({
        success: false,
        message: "Módulo não encontrado ou você não tem permissão para editá-lo",
      });
    }
    
    const cursoId = modulos[0].ID_CURSO;

    // Processar arquivo
    let arquivo = null;
    let tamanhoArquivo = null;
    let tipoArquivo = null;
    if (req.file) {
      arquivo = req.file.buffer;
      tamanhoArquivo = req.file.size;
      tipoArquivo = req.file.mimetype;
    }

    let result;
    if (aula_id) {
      // Atualizar
      const updateQuery = `UPDATE AULA SET TITULO = ?, DESCRICAO = ?, DURACAO = ?, ORDEM = ?, TIPO_CONTEUDO = ?, VIDEO_URL = ? ${
        arquivo ? ", ARQUIVO = ?, TAMANHO_ARQUIVO = ?, TIPO_ARQUIVO = ?" : ""
      } WHERE ID_AULA = ? AND ID_MODULO = ?`;
      const params = [
        titulo,
        descricao,
        duracao || "00:00:00",
        ordem || 1,
        tipo_conteudo || "video",
        video_url || "",
        ...(arquivo ? [arquivo, tamanhoArquivo, tipoArquivo] : []),
        aula_id,
        modulo_id,
      ];
      [result] = await db.query(updateQuery, params);
    } else {
      // Inserir
      const insertQuery = `INSERT INTO AULA (ID_MODULO, TITULO, DESCRICAO, DURACAO, ORDEM, TIPO_CONTEUDO, VIDEO_URL, ARQUIVO, TAMANHO_ARQUIVO, TIPO_ARQUIVO) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
      const params = [
        modulo_id,
        titulo,
        descricao,
        duracao || "00:00:00",
        ordem || 1,
        tipo_conteudo || "video",
        video_url || "",
        arquivo,
        tamanhoArquivo,
        tipoArquivo,
      ];
      [result] = await db.query(insertQuery, params);
    }

    if (result.affectedRows > 0) {
      const message = aula_id ? "Aula atualizada com sucesso!" : "Aula criada com sucesso!";
      req.flash("success", message); // Manter flash para caso de reload manual
      res.json({
        success: true,
        message,
        cursoId: cursoId,
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Não foi possível salvar a aula.",
      });
    }

  } catch (err) {
    console.error("Erro ao salvar aula:", err);
    res.status(500).json({
      success: false,
      message: "Erro interno do servidor ao salvar a aula.",
      error: err.message,
    });
  }
});

router.get("/p_criar_exer", (req, res) => {
  res.render("dashboard/professor/p_criar_exer", {
    user: req.user,
    title: "Criar Exercício",
  });
});

router.get("/p_criar_curso", professorController.getCriarCursoPage);

router.get("/p_criar_mat", (req, res) => {
  res.render("dashboard/professor/p_criar_mat", {
    user: req.user,
    title: "Criar Material",
  });
});
router.get("/p-modulo", (req, res) => {
  res.render("dashboard/professor/p-modulo", {
    user: req.user,
    title: "Criar Modulo",
  });
});

router.post(
  "/p_criar_curso",
  upload.single("imagem"),
  professorController.criarCurso
);
router.post("/p-modulo", professorController.criarModulo);

// Rota para excluir aula
router.delete("/aula/:id", async (req, res) => {
  try {
    const aulaId = req.params.id;
    // Verificar se a aula pertence a um módulo de um curso do professor
    const [aulas] = await db.query(
      `SELECT a.* FROM AULA a 
       JOIN MODULO m ON a.ID_MODULO = m.ID_MODULO 
       JOIN CURSOS c ON m.ID_CURSO = c.ID_CURSO 
       WHERE a.ID_AULA = ? AND c.ID_USUARIO = ?`,
      [aulaId, req.user.ID_USUARIO]
    );

    if (!aulas || aulas.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Aula não encontrada ou você não tem permissão para excluí-la",
      });
    }

    await db.query("DELETE FROM AULA WHERE ID_AULA = ?", [aulaId]);
    res.json({ success: true, message: "Aula excluída com sucesso" });
  } catch (err) {
    console.error("Erro ao excluir aula:", err);
    res.status(500).json({
      success: false,
      message: "Erro ao excluir aula",
      error: err.message,
    });
  }
});

// Rota para excluir módulo
router.delete("/modulo/:id", async (req, res) => {
  try {
    const moduloId = req.params.id;
    // Verificar se o módulo pertence a um curso do professor
    const [modulos] = await db.query(
      `SELECT m.* FROM MODULO m 
       JOIN CURSOS c ON m.ID_CURSO = c.ID_CURSO 
       WHERE m.ID_MODULO = ? AND c.ID_USUARIO = ?`,
      [moduloId, req.user.ID_USUARIO]
    );

    if (!modulos || modulos.length === 0) {
      return res.status(404).json({
        success: false,
        message:
          "Módulo não encontrado ou você não tem permissão para excluí-lo",
      });
    }

    // Excluir todas as aulas do módulo primeiro
    await db.query("DELETE FROM AULA WHERE ID_MODULO = ?", [moduloId]);
    // Depois excluir o módulo
    await db.query("DELETE FROM MODULO WHERE ID_MODULO = ?", [moduloId]);

    res.json({
      success: true,
      message: "Módulo e suas aulas foram excluídos com sucesso",
    });
  } catch (err) {
    console.error("Erro ao excluir módulo:", err);
    res.status(500).json({
      success: false,
      message: "Erro ao excluir módulo",
      error: err.message,
    });
  }
});

// Rota para excluir curso
router.delete("/curso/:id", async (req, res) => {
  try {
    const cursoId = req.params.id;

    // Verificar se o curso pertence ao professor
    const [cursos] = await db.query(
      "SELECT * FROM CURSOS WHERE ID_CURSO = ? AND ID_USUARIO = ?",
      [cursoId, req.user.ID_USUARIO]
    );

    if (!cursos || cursos.length === 0) {
      return res.status(403).json({
        success: false,
        message:
          "Curso não encontrado ou você não tem permissão para excluí-lo",
      });
    }

    // Excluir todas as aulas do curso
    await db.query(
      `DELETE a FROM AULA a 
       JOIN MODULO m ON a.ID_MODULO = m.ID_MODULO 
       WHERE m.ID_CURSO = ?`,
      [cursoId]
    );

    // Excluir todos os módulos do curso
    await db.query("DELETE FROM MODULO WHERE ID_CURSO = ?", [cursoId]);

    // Excluir o curso
    await db.query("DELETE FROM CURSOS WHERE ID_CURSO = ?", [cursoId]);

    res.json({
      success: true,
      message: "Curso excluído com sucesso",
    });
  } catch (err) {
    console.error("Erro ao excluir curso:", err);
    res.status(500).json({
      success: false,
      message: "Erro ao excluir curso",
      error: err.message,
    });
  }
});

// Rota para exclusão de curso
router.post("/excluir_curso/:id", professorController.excluirCurso);

// Rota para atualização completa de curso, módulos e aulas (sem AJAX)
router.post(
  "/p_gere_curso_completo/:id",
  upload.single("imagem"),
  professorController.atualizarCursoCompleto
);


// Rota para buscar o ID do módulo de uma aula
router.get("/aula/:id/modulo", async (req, res) => {
  const aulaId = req.params.id;
  try {
    const [aula] = await db.query(
      "SELECT ID_MODULO FROM AULA WHERE ID_AULA = ?",
      [aulaId]
    );
    if (!aula || aula.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Aula não encontrada" });
    }
    return res.json({ success: true, moduloId: aula[0].ID_MODULO });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ success: false, message: "Erro ao buscar módulo da aula" });
  }
});

// Rota para buscar os dados de uma aula
router.get("/aula/:id", async (req, res) => {
  const aulaId = req.params.id;
  try {
    const [aula] = await db.query("SELECT * FROM AULA WHERE ID_AULA = ?", [
      aulaId,
    ]);
    if (!aula || aula.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Aula não encontrada" });
    }
    return res.json({ success: true, data: aula[0] });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ success: false, message: "Erro ao buscar aula" });
  }
});

// Rota para atualizar (editar) uma aula
router.put("/aula/:id", upload.none(), async (req, res) => {
  const aulaId = req.params.id;
  const { titulo, duracao, ordem, modulo_id, descricao, tipo_conteudo, video_url } = req.body;
  
  try {
    // Verificar se a aula pertence a um curso do professor
    const [aulas] = await db.query(
      `SELECT a.* FROM AULA a 
       JOIN MODULO m ON a.ID_MODULO = m.ID_MODULO 
       JOIN CURSOS c ON m.ID_CURSO = c.ID_CURSO 
       WHERE a.ID_AULA = ? AND c.ID_USUARIO = ?`,
      [aulaId, req.user.ID_USUARIO]
    );

    if (!aulas || aulas.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: "Aula não encontrada ou você não tem permissão para editá-la" 
      });
    }

    // Atualizar a aula
    await db.query(
      "UPDATE AULA SET TITULO = ?, DURACAO = ?, ORDEM = ?, ID_MODULO = ?, DESCRICAO = ?, TIPO_CONTEUDO = ?, VIDEO_URL = ? WHERE ID_AULA = ?",
      [titulo, duracao, ordem, modulo_id, descricao, tipo_conteudo || "video", video_url || "", aulaId]
    );

    // Buscar a aula atualizada com todos os dados necessários
    const [aulaAtualizada] = await db.query(`
      SELECT a.*, m.TITULO as MODULO_TITULO 
      FROM AULA a 
      JOIN MODULO m ON a.ID_MODULO = m.ID_MODULO 
      WHERE a.ID_AULA = ?
    `, [aulaId]);

    return res.json({ 
      success: true, 
      message: "Aula atualizada com sucesso.",
      data: aulaAtualizada[0]
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ 
      success: false, 
      message: "Erro ao atualizar aula." 
    });
  }
});

// Rota para criar módulo via AJAX
router.post("/modulo", async (req, res) => {
  try {
    const { titulo, descricao, cursoId } = req.body;
    
    // Add debug logging
    console.log('Received request body:', req.body);
    console.log('User ID:', req.user.ID_USUARIO);

    if (!titulo || !descricao) {
      return res.status(400).json({
        success: false,
        message: "Preencha todos os campos obrigatórios!",
      });
    }

    if (!cursoId) {
      return res.status(400).json({
        success: false,
        message: "Curso não identificado!",
      });
    }

    // Add debug logging
    console.log('Checking course ownership - Course ID:', cursoId, 'User ID:', req.user.ID_USUARIO);

    // Verificar se o curso pertence ao professor
    const [cursos] = await db.query(
      "SELECT * FROM CURSOS WHERE ID_CURSO = ? AND ID_USUARIO = ?",
      [cursoId, req.user.ID_USUARIO]
    );

    // Add debug logging
    console.log('Query result:', cursos);

    if (!cursos || cursos.length === 0) {
      return res.status(403).json({
        success: false,
        message: "Você não tem permissão para adicionar módulos a este curso",
      });
    }

    // Buscar a próxima ordem disponível
    const [ordens] = await db.query(
      "SELECT MAX(ORDEM) as maxOrdem FROM MODULO WHERE ID_CURSO = ?",
      [cursoId]
    );
    const proximaOrdem = (ordens[0].maxOrdem || 0) + 1;

    const [result] = await db.query(
      "INSERT INTO MODULO (TITULO, DESCRICAO, ID_CURSO, ORDEM) VALUES (?, ?, ?, ?)",
      [titulo, descricao, cursoId, proximaOrdem]
    );

    const moduloId = result.insertId;

    // Buscar o módulo recém-criado
    const [modulos] = await db.query(
      "SELECT * FROM MODULO WHERE ID_MODULO = ?",
      [moduloId]
    );

    res.json({
      success: true,
      message: "Módulo criado com sucesso!",
      data: modulos[0],
    });
  } catch (err) {
    console.error("Erro ao criar módulo:", err);
    res.status(500).json({
      success: false,
      message: "Erro ao criar módulo",
      error: err.message,
    });
  }
});

// Rota para criar aula via AJAX
router.post("/aula", upload.none(), async (req, res) => {
  try {
    console.log('Recebendo requisição para criar aula:', req.body);

    const {
      titulo,
      descricao,
      modulo_id,
      duracao,
      ordem,
      tipo_conteudo,
      video_url,
    } = req.body;

    // Validação básica
    if (!titulo || !descricao || !modulo_id) {
      console.log('Validação falhou:', { titulo, descricao, modulo_id });
      return res.status(400).json({
        success: false,
        message: "Preencha todos os campos obrigatórios",
      });
    }

    // Verificar se o módulo pertence a um curso do professor
    const [modulos] = await db.query(
      `SELECT m.* FROM MODULO m 
       JOIN CURSOS c ON m.ID_CURSO = c.ID_CURSO 
       WHERE m.ID_MODULO = ? AND c.ID_USUARIO = ?`,
      [modulo_id, req.user.ID_USUARIO]
    );

    if (!modulos || modulos.length === 0) {
      console.log('Módulo não encontrado ou sem permissão:', { modulo_id, usuario: req.user.ID_USUARIO });
      return res.status(403).json({
        success: false,
        message:
          "Módulo não encontrado ou você não tem permissão para editá-lo",
      });
    }

    // Criar nova aula
    const [result] = await db.query(
      `INSERT INTO AULA (
        ID_MODULO, 
        TITULO, 
        DESCRICAO, 
        DURACAO, 
        ORDEM,
        TIPO_CONTEUDO,
        VIDEO_URL
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        modulo_id,
        titulo,
        descricao,
        duracao || "00:00:00",
        ordem || 1,
        tipo_conteudo || "video",
        video_url || "",
      ]
    );

    console.log('Aula criada com sucesso:', { id: result.insertId });

    // Buscar a aula recém-criada com todos os dados necessários
    const [aulas] = await db.query(`
      SELECT a.*, m.TITULO as MODULO_TITULO 
      FROM AULA a 
      JOIN MODULO m ON a.ID_MODULO = m.ID_MODULO 
      WHERE a.ID_AULA = ?
    `, [result.insertId]);

    if (!aulas || aulas.length === 0) {
      console.error('Erro: Aula criada mas não encontrada na consulta');
      return res.status(500).json({
        success: false,
        message: "Erro ao recuperar dados da aula criada",
      });
    }

    const aulaData = aulas[0];
    console.log('Dados da aula para retorno:', aulaData);

    res.json({
      success: true,
      message: "Aula criada com sucesso",
      data: aulaData,
    });
  } catch (err) {
    console.error("Erro ao criar aula:", err);
    res.status(500).json({
      success: false,
      message: "Erro ao criar aula",
      error: err.message,
    });
  }
});

// --- CRUD de foto de perfil e conta do professor ---
// Upload da foto do perfil
router.post("/upload-foto", upload.single("foto_perfil"), professorController.uploadFoto);
// Excluir foto do perfil
router.post("/excluir-foto", professorController.excluirFoto);
// Servir foto de perfil
router.get("/foto-perfil/:id", professorController.fotoPerfil);
// Excluir conta do professor
router.post("/excluir-conta", professorController.excluirConta);

// Rota de logout para professor
router.get('/logout', (req, res, next) => {
    req.logout(function(err) {
        if (err) {
            console.error('Erro no logout do professor:', err);
            req.flash('error', 'Erro ao fazer logout: ' + err.message);
            return res.redirect('/professor/p-professor');
        }
        req.session.destroy((err) => {
            if (err) {
                console.error('Erro ao destruir sessão no logout do professor:', err);
            }
            res.clearCookie('connect.sid');
            res.redirect('/');
        });
    });
});

router.post("/salvar-dados-bancarios", professorController.salvarDadosBancarios);

// Rota para atualizar módulo
router.put("/modulo/:id", async (req, res) => {
  try {
    const moduloId = req.params.id;
    const { titulo, descricao } = req.body;

    // Verificar se o módulo pertence a um curso do professor
    const [modulos] = await db.query(
      `SELECT m.* FROM MODULO m 
       JOIN CURSOS c ON m.ID_CURSO = c.ID_CURSO 
       WHERE m.ID_MODULO = ? AND c.ID_USUARIO = ?`,
      [moduloId, req.user.ID_USUARIO]
    );

    if (!modulos || modulos.length === 0) {
      return res.status(403).json({
        success: false,
        message: "Módulo não encontrado ou você não tem permissão para editá-lo"
      });
    }

    // Atualiza o módulo
    await db.query(
      "UPDATE MODULO SET TITULO = ?, DESCRICAO = ? WHERE ID_MODULO = ?",
      [titulo, descricao, moduloId]
    );

    res.json({
      success: true,
      message: "Módulo atualizado com sucesso"
    });
  } catch (err) {
    console.error("Erro ao atualizar módulo:", err);
    res.status(500).json({
      success: false,
      message: "Erro ao atualizar módulo"
    });
  }
});

// Rota para fazer o download do arquivo de uma aula
router.get('/aula/:aula_id/arquivo', professorController.getAulaArquivo);

module.exports = router;
