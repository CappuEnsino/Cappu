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
    });
  } catch (err) {
    console.error("Erro ao listar cursos:", err);
    req.flash("error", "Erro ao buscar cursos!");
    res.render("dashboard/professor/p-curso_prof", {
      user: req.user || {},
      cursos: [],
      title: "Curso Professor",
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

// Criação de aula
exports.criarAula = async (req, res) => {
  try {
    const { titulo, descricao, modulo_id } = req.body;
    let videoPath = null;
    if (req.file) {
      videoPath = req.file.filename; // ou req.file.path, conforme config do multer
    }
    if (!titulo || !descricao || !modulo_id) {
      req.flash("error", "Preencha todos os campos obrigatórios!");
      return res.redirect("/dashboard/professor/p-criar_aula");
    }
    await db.query(
      "INSERT INTO AULA (TITULO, DESCRICAO, ID_MODULO, VIDEO) VALUES (?, ?, ?, ?)",
      [titulo, descricao, modulo_id, videoPath]
    );
    req.flash("success", "Aula criada com sucesso!");
    res.redirect("/dashboard/professor/p-modulo?moduloId=" + modulo_id);
  } catch (err) {
    console.error("Erro ao criar aula:", err);
    req.flash("error", "Erro ao criar aula!");
    res.redirect("/dashboard/professor/p-criar_aula");
  }
};

// Atualizar curso por ID
exports.updateCursoById = async (req, res) => {
  try {
    const cursoId = req.params.id;
    const { titulo, descricao, categoria, preco, duracao_total, objetivos } =
      req.body;

    // Processa a imagem se foi enviada
    let imagemBuffer = null;
    if (req.file) {
      imagemBuffer = req.file.buffer;
    }

    // Se não houver nova imagem, mantém a imagem existente
    if (imagemBuffer) {
      await db.query(
        `UPDATE CURSOS SET TITULO = ?, DESCRICAO = ?, ID_CATEGORIA = ?, PRECO = ?, DURACAO_TOTAL = ?, OBJETIVOS = ?, IMAGEM = ? WHERE ID_CURSO = ?`,
        [
          titulo,
          descricao,
          categoria,
          preco,
          duracao_total,
          objetivos,
          imagemBuffer,
          cursoId,
        ]
      );
    } else {
      await db.query(
        `UPDATE CURSOS SET TITULO = ?, DESCRICAO = ?, ID_CATEGORIA = ?, PRECO = ?, DURACAO_TOTAL = ?, OBJETIVOS = ? WHERE ID_CURSO = ?`,
        [titulo, descricao, categoria, preco, duracao_total, objetivos, cursoId]
      );
    }

    req.flash("success", "Curso atualizado com sucesso!");
    res.redirect("/dashboard/professor/p_gere_curso/" + cursoId);
  } catch (err) {
    console.error("Erro ao atualizar curso:", err);
    req.flash("error", "Erro ao atualizar curso!");
    res.redirect("/dashboard/professor/p_gere_curso/" + req.params.id);
  }
};

// Buscar curso por ID para edição (com módulos e aulas)
exports.getCursoById = async (req, res) => {
  try {
    const cursoId = req.params.id;
    // Busca o curso específico
    const [rows] = await db.query(
      `SELECT c.*, cat.NOME as CATEGORIA, c.ID_CATEGORIA FROM CURSOS c 
       LEFT JOIN CATEGORIAS cat ON c.ID_CATEGORIA = cat.ID_CATEGORIA 
       WHERE c.ID_CURSO = ?`,
      [cursoId]
    );
    if (!rows || rows.length === 0) {
      req.flash("error", "Curso não encontrado!");
      return res.redirect("/dashboard/professor/p-curso_prof");
    }

    const curso = rows[0];

    // Busca todas as categorias disponíveis
    const [categorias] = await db.query(
      "SELECT * FROM CATEGORIAS ORDER BY NOME"
    );

    // Buscar módulos do curso
    const [modulos] = await db.query(
      `SELECT * FROM MODULO WHERE ID_CURSO = ? ORDER BY ORDEM ASC`, // Adicionado ORDER BY
      [cursoId]
    );

    // Buscar aulas de cada módulo
    for (let modulo of modulos) {
      const [aulas] = await db.query(
        `SELECT * FROM AULA WHERE ID_MODULO = ? ORDER BY ORDEM ASC`,
        [
          // Adicionado ORDER BY
          modulo.ID_MODULO,
        ]
      );
      modulo.aulas = aulas;
    }

    console.log("DEBUG - modulos enviados para a view:", modulos);
    res.render("dashboard/professor/p_gere_curso", {
      user: req.user,
      curso,
      categorias,
      modulos: modulos || [],
      title: "Editar Curso",
    });
  } catch (err) {
    console.error("Erro ao buscar curso:", err);
    req.flash("error", "Erro ao buscar curso!");
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

// Exporte todas as funções explicitamente
module.exports = exports;
