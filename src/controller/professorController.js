const db = require("../config/database");


// Página de criação de curso: busca categorias e renderiza
exports.getCriarCursoPage = async (req, res) => {
  try {
    const [categorias] = await db.query(
      "SELECT * FROM CATEGORIAS ORDER BY NOME"
    );
    res.render("dashboard/professor/p_criar_curso", {
      user: req.user,
      categorias,
      title: "Criar Curso",
      success: req.flash("success"),
      error: req.flash("error"),
      timestamp: Date.now(),
    });
  } catch (err) {
    console.error("Erro ao buscar categorias:", err);
    req.flash("error", "Erro ao carregar categorias!");
    res.render("dashboard/professor/p_criar_curso", {
      user: req.user,
      categorias: [],
      title: "Criar Curso",
      success: req.flash("success"),
      error: req.flash("error"),
      timestamp: Date.now(),
    });
  }
};

// Listar todos os cursos do professor
exports.listarCursosProfessor = async (req, res) => {
  try {
    const professorId = req.user.ID_USUARIO || req.user.id;
    const [cursos] = await db.query(
      `SELECT c.ID_CURSO, c.TITULO, cat.NOME as CATEGORIA
       FROM CURSOS c
       LEFT JOIN CATEGORIAS cat ON c.ID_CATEGORIA = cat.ID_CATEGORIA
       WHERE c.ID_USUARIO = ?`,
      [professorId]
    );
    res.render("dashboard/professor/p-curso_prof", {
      user: req.user,
      cursos,
      title: "Curso Professor",
      success: req.flash("success"),
      timestamp: Date.now(),
    });
  } catch (err) {
    console.error("Erro ao listar cursos:", err);
    req.flash("error", "Erro ao buscar cursos!");
    res.render("dashboard/professor/p-curso_prof", {
      user: req.user || {},
      cursos: [],
      title: "Curso Professor",
      timestamp: Date.now(),
    });
  }
};

// Criação de curso
exports.criarCurso = async (req, res) => {
  try {
    const {
      titulo,
      descricao,
      categoria,
      preco,
      duracao_total,
      objetivos,
      modulos,
    } = req.body;

    // Processa a imagem se foi enviada
    let imagemBuffer = null;
    if (req.file) {
      imagemBuffer = req.file.buffer;
    }

    const professorId = req.user.ID_USUARIO || req.user.id;
    if (
      !titulo ||
      !descricao ||
      !categoria ||
      !preco ||
      !duracao_total ||
      !objetivos
    ) {
      req.flash("error", "Preencha todos os campos obrigatórios!");
      return res.redirect("/dashboard/professor/p_criar_curso");
    }

    // Busca o próximo ID_CURSO manualmente
    const [rows] = await db.query("SELECT MAX(ID_CURSO) as maxId FROM CURSOS");
    const nextId = (rows[0].maxId || 0) + 1;

    await db.query(
      "INSERT INTO CURSOS (ID_CURSO, TITULO, DESCRICAO, ID_CATEGORIA, ID_USUARIO, PRECO, DURACAO_TOTAL, OBJETIVOS, DATA_CRIACAO, IMAGEM) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?)",
      [
        nextId,
        titulo,
        descricao,
        categoria,
        professorId,
        preco,
        duracao_total,
        objetivos,
        imagemBuffer,
      ]
    );

    // Se houver módulos enviados
    let modulosArr = [];
    try {
      if (modulos) {
        modulosArr = JSON.parse(modulos);
      }
    } catch (e) {
      modulosArr = [];
    }
    for (const modulo of modulosArr) {
      // Cria módulo
      const [moduloResult] = await db.query(
        "INSERT INTO MODULO (TITULO, DESCRICAO, ID_CURSO) VALUES (?, ?, ?)",
        [
          modulo.titulo || modulo.TITULO,
          modulo.descricao || modulo.DESCRICAO,
          nextId,
        ]
      );
      const moduloId = moduloResult.insertId;
      // Cria aulas deste módulo
      if (modulo.aulas && Array.isArray(modulo.aulas)) {
        for (const aula of modulo.aulas) {
          await db.query(
            `INSERT INTO AULA (
              ID_MODULO,
              TITULO,
              DESCRICAO,
              DURACAO,
              ORDEM,
              TIPO_CONTEUDO,
              VIDEO_URL,
              ARQUIVO,
              TAMANHO_ARQUIVO,
              TIPO_ARQUIVO
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              moduloId,
              aula.titulo || aula.TITULO || "",
              aula.descricao || aula.DESCRICAO || "",
              aula.duracao || aula.DURACAO || "00:00:00",
              aula.ordem || aula.ORDEM || 1,
              aula.tipo_conteudo || aula.TIPO_CONTEUDO || "video",
              aula.video_url || aula.VIDEO_URL || "",
              aula.ARQUIVO || null,
              aula.TAMANHO_ARQUIVO || null,
              aula.TIPO_ARQUIVO || null,
            ]
          );
        }
      }
    }
    req.flash("success", "Curso criado com sucesso!");
    res.redirect("/dashboard/professor/p-curso_prof");
  } catch (err) {
    console.error("Erro ao criar curso:", err);
    req.flash("error", "Erro ao criar curso!");
    res.redirect("/dashboard/professor/p_criar_curso");
  }
};

// Rota para criar/editar aula
exports.getCriarAulaPage = async (req, res) => {
  try {
    const moduloId = req.query.modulo_id;
    const aulaId = req.query.aula_id;
    console.log("Carregando página de aula. Módulo:", moduloId, "Aula:", aulaId);

    if (!moduloId && !aulaId) {
      req.flash("error", "Módulo não especificado");
      return res.redirect("/dashboard/professor/p-curso_prof");
    }

    let aula = null;
    let modulo = null;

    if (moduloId) {
      // Buscar informações do módulo e seu curso
      const [modulos] = await db.query(
        `SELECT m.*, c.TITULO as CURSO_TITULO 
         FROM MODULO m 
         JOIN CURSOS c ON m.ID_CURSO = c.ID_CURSO 
         WHERE m.ID_MODULO = ? AND c.ID_USUARIO = ?`,
        [moduloId, req.user.ID_USUARIO]
      );

      if (!modulos || modulos.length === 0) {
        req.flash("error", "Módulo não encontrado ou sem permissão");
        return res.redirect("/dashboard/professor/p-curso_prof");
      }

      modulo = modulos[0];
      console.log("Módulo encontrado:", modulo);
    }

    if (aulaId) {
      // Buscar informações da aula para edição
      const [aulas] = await db.query(
        `SELECT a.*, m.TITULO as MODULO_TITULO 
         FROM AULA a 
         JOIN MODULO m ON a.ID_MODULO = m.ID_MODULO 
         JOIN CURSOS c ON m.ID_CURSO = c.ID_CURSO 
         WHERE a.ID_AULA = ? AND c.ID_USUARIO = ?`,
        [aulaId, req.user.ID_USUARIO]
      );

      if (!aulas || aulas.length === 0) {
        req.flash("error", "Aula não encontrada ou sem permissão");
        return res.redirect("/dashboard/professor/p-curso_prof");
      }

      aula = aulas[0];
      console.log("Aula encontrada:", aula);

      if (!modulo) {
        const [modulos] = await db.query(
          `SELECT m.*, c.TITULO as CURSO_TITULO 
           FROM MODULO m 
           JOIN CURSOS c ON m.ID_CURSO = c.ID_CURSO 
           WHERE m.ID_MODULO = ? AND c.ID_USUARIO = ?`,
          [aula.ID_MODULO, req.user.ID_USUARIO]
        );
        modulo = modulos[0];
      }
    }

    res.render("dashboard/professor/p-criar_aula", {
      user: req.user,
      title: aulaId ? "Editar Aula" : "Criar Aula",
      modulo,
      aula,
      success: req.flash("success"),
      error: req.flash("error"),
      timestamp: Date.now()
    });
  } catch (err) {
    console.error("Erro ao carregar página de aula:", err);
    req.flash("error", "Erro ao carregar página de aula: " + err.message);
    res.redirect("/dashboard/professor/p-curso_prof");
  }
};

// Atualizar curso por ID
exports.updateCursoById = async (req, res) => {
  try {
    const cursoId = req.params.id;
    const { titulo, descricao, categoria, preco, duracao_total, objetivos } =
      req.body;
    
    // Log para verificar os dados recebidos
    console.log('Dados recebidos para atualização:', { cursoId, titulo, descricao, categoria, preco, duracao_total, objetivos });

    // Processa a imagem se foi enviada
    let imagemBuffer = null;
    if (req.file) {
      imagemBuffer = req.file.buffer;
    }

    // Monta a query de atualização
    let query = 'UPDATE CURSOS SET TITULO = ?, DESCRICAO = ?, ID_CATEGORIA = ?, PRECO = ?, DURACAO_TOTAL = ?, OBJETIVOS = ?';
    const params = [titulo, descricao, categoria, preco, duracao_total, objetivos];

    if (imagemBuffer) {
      query += ', IMAGEM = ?';
      params.push(imagemBuffer);
    }

    query += ' WHERE ID_CURSO = ? AND ID_USUARIO = ?';
    params.push(cursoId, req.user.ID_USUARIO);

    // Executa a query
    const [result] = await db.query(query, params);

    if (result.affectedRows === 0) {
      req.flash("error", "Não foi possível atualizar o curso. Verifique se você tem permissão ou se o curso existe.");
      return res.redirect("/dashboard/professor/p-curso_prof");
    }

    req.flash("success", "Curso atualizado com sucesso!");
    res.redirect("/dashboard/professor/p_gere_curso/" + cursoId);
  } catch (err) {
    console.error("Erro ao atualizar curso:", err);
    req.flash("error", "Erro ao atualizar curso: " + err.message);
    res.redirect("/dashboard/professor/p_gere_curso/" + req.params.id);
  }
};

// Buscar curso por ID para edição (com módulos e aulas)
exports.getCursoById = async (req, res) => {
  try {
    const cursoId = req.params.id;
    console.log("Buscando curso:", cursoId);

    // Busca o curso específico com JOIN para categorias
    const [rows] = await db.query(
      `SELECT c.*, cat.NOME as CATEGORIA, c.ID_CATEGORIA 
       FROM CURSOS c 
       LEFT JOIN CATEGORIAS cat ON c.ID_CATEGORIA = cat.ID_CATEGORIA 
       WHERE c.ID_CURSO = ? AND c.ID_USUARIO = ?`,
      [cursoId, req.user.ID_USUARIO]
    );

    if (!rows || rows.length === 0) {
      console.log("Curso não encontrado ou sem permissão");
      req.flash("error", "Curso não encontrado!");
      return res.redirect("/dashboard/professor/p-curso_prof");
    }

    const curso = rows[0];
    console.log("Curso encontrado:", curso.TITULO);

    // Busca todas as categorias disponíveis
    const [categorias] = await db.query(
      "SELECT * FROM CATEGORIAS ORDER BY NOME"
    );

    // Buscar módulos do curso com ordenação
    const [modulos] = await db.query(
      `SELECT * FROM MODULO WHERE ID_CURSO = ? ORDER BY ORDEM ASC, ID_MODULO ASC`,
      [cursoId]
    );

    console.log(`Encontrados ${modulos.length} módulos`);

    // Buscar aulas de cada módulo com ordenação
    for (let modulo of modulos) {
      const [aulas] = await db.query(
        `SELECT * FROM AULA WHERE ID_MODULO = ? ORDER BY ORDEM ASC, ID_AULA ASC`,
        [modulo.ID_MODULO]
      );
      modulo.aulas = aulas;
      console.log(`Módulo ${modulo.TITULO}: ${aulas.length} aulas`);
    }

    // Enviar dados para o template
    res.render("dashboard/professor/p_gere_curso", {
      user: req.user,
      curso,
      categorias,
      modulos: modulos || [],
      title: "Editar Curso",
      timestamp: Date.now(),
      success: req.flash('success'),
      error: req.flash('error')
    });
  } catch (err) {
    console.error("Erro ao buscar curso:", err);
    req.flash("error", "Erro ao buscar curso: " + err.message);
    res.redirect("/dashboard/professor/p-curso_prof");
  }
};

// Exclusão de curso
exports.excluirCurso = async (req, res) => {
  try {
    const cursoId = req.params.id;
    // Remove todas as aulas dos módulos deste curso
    await db.query(
      "DELETE FROM AULA WHERE ID_MODULO IN (SELECT ID_MODULO FROM MODULO WHERE ID_CURSO = ?)",
      [cursoId]
    );
    // Remove todos os módulos do curso
    await db.query("DELETE FROM MODULO WHERE ID_CURSO = ?", [cursoId]);
    // Remove o curso
    await db.query("DELETE FROM CURSOS WHERE ID_CURSO = ?", [cursoId]);
    req.flash("success", "Curso excluído com sucesso!");
    res.redirect("/dashboard/professor/p-curso_prof");
  } catch (err) {
    console.error("Erro ao excluir curso:", err);
    req.flash("error", "Erro ao excluir curso!");
    res.redirect("/dashboard/professor/p_gere_curso/" + req.params.id);
  }
};

// Criação de módulo
exports.criarModulo = async (req, res) => {
  try {
    const { titulo, descricao } = req.body;
    // ID_CURSO pode vir via query ou session, ajuste conforme fluxo real
    const cursoId = req.query.cursoId || req.body.cursoId;
    if (!titulo || !descricao) {
      req.flash("error", "Preencha todos os campos obrigatórios!");
      return res.redirect("/dashboard/professor/p-modulo");
    }
    if (!cursoId) {
      req.flash("error", "Curso não identificado!");
      return res.redirect("/dashboard/professor/p-curso_prof");
    }
    const [result] = await db.query(
      "INSERT INTO MODULO (TITULO, DESCRICAO, ID_CURSO) VALUES (?, ?, ?)",
      [titulo, descricao, cursoId]
    );
    const moduloId = result.insertId;
    req.flash("success", "Módulo criado com sucesso!");
    res.redirect(`/dashboard/professor/p-criar_aula?moduloId=${moduloId}`);
  } catch (err) {
    console.error("Erro ao criar módulo:", err);
    req.flash("error", "Erro ao criar módulo!");
    res.redirect("/dashboard/professor/p-modulo");
  }
};

// Atualização completa de curso, módulos e aulas, incluindo exclusão
exports.atualizarCursoCompleto = async (req, res) => {
  const idCurso = req.params.id;

  // LOG: Ver dados recebidos
  console.log("DEBUG - req.body.modulos:", req.body.modulos);
  console.log("REQ.BODY:", req.body);

  // Parse dos campos recebidos do form (recomendado)
  let curso = req.body.curso;
  if (typeof curso === "string") {
    try {
      curso = JSON.parse(curso);
    } catch (e) {
      return res
        .status(400)
        .send("Erro ao processar dados do curso: " + e.message);
    }
  }

  let modulos = [];
  let modulosExcluidos = [];
  let aulasExcluidas = [];
  try {
    modulos = JSON.parse(req.body.modulos || "[]");
    modulosExcluidos = JSON.parse(req.body.modulosExcluidos || "[]");
    aulasExcluidas = JSON.parse(req.body.aulasExcluidas || "[]");
  } catch (e) {
    return res
      .status(400)
      .send(
        "Erro ao processar dados de módulos/aulas do formulário: " + e.message
      );
  }

  // NOVO: Se curso não veio como objeto, montar a partir dos campos do form
  if (!curso || typeof curso !== "object") {
    curso = {
      TITULO: req.body.titulo,
      DESCRICAO: req.body.descricao,
      ID_CATEGORIA: req.body.categoria,
      PRECO: req.body.preco,
      DURACAO_TOTAL: req.body.duracao_total,
      OBJETIVOS: req.body.objetivos,
    };
  }

  // LOG: Ver dados finais do curso e módulos
  console.log("CURSO:", curso);
  console.log("MODULOS:", modulos);

  // Validação básica
  if (
    !curso.TITULO ||
    !curso.DESCRICAO ||
    !curso.ID_CATEGORIA ||
    !curso.PRECO ||
    !curso.DURACAO_TOTAL ||
    !curso.OBJETIVOS
  ) {
    req.flash("error", "Preencha todos os campos obrigatórios do curso!");
    return res.redirect("/dashboard/professor/p_gere_curso/" + idCurso);
  }

  const conn = db;
  const connection = await conn.getConnection();

  try {
    await connection.beginTransaction();

    // Atualiza curso - CORRIGIDO: Adicionado ID_CATEGORIA e DURACAO_TOTAL
    await connection.query(
      "UPDATE CURSOS SET TITULO = ?, DESCRICAO = ?, ID_CATEGORIA = ?, PRECO = ?, DURACAO_TOTAL = ?, OBJETIVOS = ? WHERE ID_CURSO = ?",
      [
        curso.TITULO,
        curso.DESCRICAO,
        curso.ID_CATEGORIA, // Campo adicionado
        curso.PRECO,
        curso.DURACAO_TOTAL, // Campo adicionado
        curso.OBJETIVOS,
        idCurso,
      ]
    );

    // Exclui aulas
    if (aulasExcluidas.length > 0) {
      await connection.query(
        `DELETE FROM AULA WHERE ID_AULA IN (${aulasExcluidas
          .map(() => "?")
          .join(",")})`,
        aulasExcluidas
      );
    }

    // Exclui módulos e suas aulas
    if (modulosExcluidos.length > 0) {
      await connection.query(
        `DELETE FROM AULA WHERE ID_MODULO IN (${modulosExcluidos
          .map(() => "?")
          .join(",")})`,
        modulosExcluidos
      );
      await connection.query(
        `DELETE FROM MODULO WHERE ID_MODULO IN (${modulosExcluidos
          .map(() => "?")
          .join(",")})`,
        modulosExcluidos
      );
    }

    // Atualiza/adiciona módulos e aulas
    for (const modulo of modulos) {
      if (modulo.ID_MODULO) {
        await connection.query(
          "UPDATE MODULO SET TITULO = ?, DESCRICAO = ?, ORDEM = ? WHERE ID_MODULO = ?",
          [
            modulo.TITULO || modulo.titulo,
            modulo.DESCRICAO || modulo.descricao,
            modulo.ORDEM || modulo.ordem,
            modulo.ID_MODULO,
          ]
        );
      } else {
        const [result] = await connection.query(
          "INSERT INTO MODULO (ID_CURSO, TITULO, DESCRICAO, ORDEM) VALUES (?, ?, ?, ?)",
          [
            idCurso,
            modulo.TITULO || modulo.titulo,
            modulo.DESCRICAO || modulo.descricao,
            modulo.ORDEM || modulo.ordem,
          ]
        );
        modulo.ID_MODULO = result.insertId;
      }

      for (const aula of modulo.aulas || []) {
        // Só faz UPDATE se ID_AULA for numérico
        if (aula.ID_AULA && !isNaN(Number(aula.ID_AULA))) {
          // Construção dinâmica da query para incluir campos de arquivo apenas se existirem
          let updateQuery = `UPDATE AULA SET 
              TITULO = ?, 
              DESCRICAO = ?, 
              DURACAO = ?, 
              ORDEM = ?,
              TIPO_CONTEUDO = ?,
              VIDEO_URL = ?`;
          let updateParams = [
            aula.TITULO || aula.titulo || "",
            aula.DESCRICAO || aula.descricao || "",
            aula.DURACAO || aula.duracao || "00:00:00",
            aula.ORDEM || aula.ordem || 1,
            aula.TIPO_CONTEUDO || aula.tipo_conteudo || "video",
            aula.VIDEO_URL || aula.video_url || "",
          ];

          if (aula.ARQUIVO) {
            updateQuery += ", ARQUIVO = ?";
            updateParams.push(aula.ARQUIVO);
          }
          if (aula.TAMANHO_ARQUIVO) {
            updateQuery += ", TAMANHO_ARQUIVO = ?";
            updateParams.push(aula.TAMANHO_ARQUIVO);
          }
          if (aula.TIPO_ARQUIVO) {
            updateQuery += ", TIPO_ARQUIVO = ?";
            updateParams.push(aula.TIPO_ARQUIVO);
          }

          updateQuery += " WHERE ID_AULA = ?";
          updateParams.push(aula.ID_AULA);

          await connection.query(updateQuery, updateParams);
        } else {
          // Construção dinâmica da query para inserir campos de arquivo apenas se existirem
          let insertColumns = `ID_MODULO, TITULO, DESCRICAO, DURACAO, ORDEM, TIPO_CONTEUDO, VIDEO_URL`;
          let insertPlaceholders = `?, ?, ?, ?, ?, ?, ?`;
          let insertParams = [
            modulo.ID_MODULO,
            aula.TITULO || aula.titulo || "",
            aula.DESCRICAO || aula.descricao || "",
            aula.DURACAO || aula.duracao || "00:00:00",
            aula.ORDEM || aula.ordem || 1,
            aula.TIPO_CONTEUDO || aula.tipo_conteudo || "video",
            aula.VIDEO_URL || aula.video_url || "",
          ];

          if (aula.ARQUIVO) {
            insertColumns += ", ARQUIVO";
            insertPlaceholders += ", ?";
            insertParams.push(aula.ARQUIVO);
          }
          if (aula.TAMANHO_ARQUIVO) {
            insertColumns += ", TAMANHO_ARQUIVO";
            insertPlaceholders += ", ?";
            insertParams.push(aula.TAMANHO_ARQUIVO);
          }
          if (aula.TIPO_ARQUIVO) {
            insertColumns += ", TIPO_ARQUIVO";
            insertPlaceholders += ", ?";
            insertParams.push(aula.TIPO_ARQUIVO);
          }

          const [result] = await connection.query(
            `INSERT INTO AULA (${insertColumns}) VALUES (${insertPlaceholders})`,
            insertParams
          );
          aula.ID_AULA = result.insertId;
        }
      }
    }
    await connection.commit();
    req.flash("success", "Curso atualizado com sucesso!");
    res.redirect("/dashboard/professor/p_gere_curso/" + idCurso);
  } catch (err) {
    await connection.rollback();
    console.error("Erro na atualização completa do curso:", err); // Log mais específico
    req.flash("error", "Erro ao atualizar curso: " + err.message); // Mensagem de erro mais útil
    res.redirect("/dashboard/professor/p_gere_curso/" + idCurso);
  } finally {
    connection.release();
  }
};

// Upload da foto do perfil do professor
exports.uploadFoto = async (req, res) => {
  const db = require("../config/database");
  if (!req.file) {
    req.flash('error', 'Nenhum arquivo enviado!');
    return res.redirect('/professor/p-config');
  }
  try {
    if (!req.user || !req.user.ID_USUARIO) {
      req.flash('error', 'Usuário não autenticado para upload de foto.');
      return res.redirect('/professor/p-config');
    }
    await db.query('UPDATE USUARIO SET FOTO_PERFIL = ? WHERE ID_USUARIO = ?', [req.file.buffer, req.user.ID_USUARIO]);
    // Atualiza a sessão
    const [rows] = await db.query('SELECT * FROM USUARIO WHERE ID_USUARIO = ?', [req.user.ID_USUARIO]);
    if (rows.length) {
      req.user.FOTO_PERFIL = rows[0].FOTO_PERFIL;
    }
    req.flash('success', 'Foto de perfil adicionada com sucesso!');
    res.redirect('/professor/p-config');
  } catch (err) {
    console.error('Erro ao salvar foto no banco:', err);
    req.flash('error', 'Erro ao salvar foto no banco: ' + err.message);
    res.redirect('/professor/p-config');
  }
};

// Excluir foto do perfil do professor
exports.excluirFoto = async (req, res) => {
  const db = require("../config/database");
  try {
    if (!req.user || !req.user.ID_USUARIO) {
      req.flash('error', 'Usuário não autenticado para exclusão de foto.');
      return res.redirect('/professor/p-config');
    }
    await db.query('UPDATE USUARIO SET FOTO_PERFIL = NULL WHERE ID_USUARIO = ?', [req.user.ID_USUARIO]);
    if (req.user) {
      req.user.FOTO_PERFIL = null;
    }
    req.flash('success', 'Foto de perfil removida com sucesso!');
    res.redirect('/professor/p-config');
  } catch (err) {
    console.error('Erro ao excluir foto:', err);
    req.flash('error', 'Erro ao excluir foto: ' + err.message);
    res.redirect('/professor/p-config');
  }
};

// Servir foto de perfil do professor
exports.fotoPerfil = async (req, res) => {
  const db = require("../config/database");
  const path = require("path");
  try {
    const [rows] = await db.query('SELECT FOTO_PERFIL FROM USUARIO WHERE ID_USUARIO = ?', [req.params.id]);
    if (!rows.length || !rows[0].FOTO_PERFIL) {
      // Se não houver foto ou usuário, envia uma imagem padrão
      return res.sendFile(path.join(__dirname, '../../public/images/icons/perfil.svg'));
    }
    res.set('Content-Type', 'image/jpeg');
    res.send(rows[0].FOTO_PERFIL);
  } catch (err) {
    console.error('Erro ao buscar foto de perfil:', err);
    const path = require("path");
    res.sendFile(path.join(__dirname, '../../public/images/icons/perfil.svg'));
  }
};

// Exclusão de conta do professor
exports.excluirConta = async (req, res) => {
  const db = require("../config/database");
  try {
    if (!req.user || !req.user.ID_USUARIO) {
      req.flash('error', 'Usuário não autenticado.');
      return res.redirect('/professor/p-config');
    }
    const userId = req.user.ID_USUARIO;

    // Deleta dependências relacionadas ao professor
    await db.query('DELETE FROM CONFIG_PROF WHERE ID_USUARIO = ?', [userId]);
    await db.query('DELETE FROM CURSOS WHERE ID_USUARIO = ?', [userId]);
    await db.query('UPDATE USUARIO SET FOTO_PERFIL = NULL WHERE ID_USUARIO = ?', [userId]);
    await db.query('DELETE FROM USUARIO WHERE ID_USUARIO = ?', [userId]);

    // Só tente logout se a sessão ainda existir
    if (req.logout) {
      req.flash('success', 'Conta excluída com sucesso!');
      req.logout(function(err) {
        if (err) {
          console.error('Erro no logout após exclusão:', err);
          req.flash('error', 'Erro ao fazer logout: ' + err.message);
          return res.redirect('/professor/p-config');
        }
        if (req.session) {
          req.session.destroy((err) => {
            if (err) {
              console.error('Erro ao destruir sessão:', err);
              req.flash('error', 'Erro ao finalizar sessão.');
              return res.redirect('/professor/p-config');
            }
            res.clearCookie('connect.sid');
            res.redirect('/');
          });
        } else {
          res.clearCookie('connect.sid');
          res.redirect('/');
        }
      });
    } else {
      res.clearCookie('connect.sid');
      res.redirect('/');
    }
  } catch (err) {
    console.error('Erro ao excluir conta:', err);
    req.flash('error', 'Erro ao excluir conta: ' + err.message);
    res.redirect('/professor/p-config');
  }
};

// Salvar (criar/atualizar) dados bancários do professor
exports.salvarDadosBancarios = async (req, res) => {
  const { 'chave-pix': chavePix, agencia, banco, conta } = req.body;
  const idUsuario = req.user.ID_USUARIO;

  try {
    // Tenta atualizar
    const [result] = await db.query(
      `UPDATE CONFIG_PROF
       SET CONTA_PAG = ?, AGENCIA_PAG = ?, CHAVE_PIX = ?, BANCO_PAG = ?
       WHERE ID_USUARIO = ?`,
      [conta, agencia, chavePix, banco, idUsuario]
    );
    // Se não atualizou nenhuma linha, faz insert
    if (result.affectedRows === 0) {
      await db.query(
        `INSERT INTO CONFIG_PROF (ID_USUARIO, CONTA_PAG, AGENCIA_PAG, CHAVE_PIX, BANCO_PAG)
         VALUES (?, ?, ?, ?, ?)`,
        [idUsuario, conta, agencia, chavePix, banco]
      );
    }
    req.flash("success", "Dados bancários salvos com sucesso!");
    res.redirect("/professor/p-config");
  } catch (err) {
    console.error("Erro ao salvar dados bancários:", err);
    req.flash("error", "Erro ao salvar dados bancários!");
    res.redirect("/professor/p-config");
  }
};

// Rota para buscar o arquivo de uma aula
exports.getAulaArquivo = async (req, res) => {
  try {
    const { aula_id } = req.params;
    const professorId = req.user.ID_USUARIO;

    // Busca o arquivo, tipo e título da aula, verificando a permissão do professor
    const [aulas] = await db.query(
      `SELECT a.ARQUIVO, a.TIPO_ARQUIVO, a.TITULO
       FROM AULA a
       JOIN MODULO m ON a.ID_MODULO = m.ID_MODULO
       JOIN CURSOS c ON m.ID_CURSO = c.ID_CURSO
       WHERE a.ID_AULA = ? AND c.ID_USUARIO = ?`,
      [aula_id, professorId]
    );

    if (!aulas || aulas.length === 0 || !aulas[0].ARQUIVO) {
      return res.status(404).send("Arquivo não encontrado ou sem permissão de acesso.");
    }

    const aula = aulas[0];
    const fileContents = aula.ARQUIVO;
    const mimeType = aula.TIPO_ARQUIVO;
    
    // Gera um nome de arquivo a partir do título da aula
    // Ex: "Introdução ao JavaScript" -> "introducao_ao_javascript.mp4"
    const extension = mimeType.split('/')[1] || 'bin';
    const filename = `${aula.TITULO.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.${extension}`;

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(fileContents);

  } catch (err) {
    console.error("Erro ao buscar arquivo da aula:", err);
    res.status(500).send("Erro interno do servidor ao tentar buscar o arquivo.");
  }
};

// Exporte todas as funções explicitamente
module.exports = exports;
