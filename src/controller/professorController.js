const db = require('../config/database');

// Página de criação de curso: busca categorias e renderiza
exports.getCriarCursoPage = async (req, res) => {
  try {
    const [categorias] = await db.query('SELECT * FROM CATEGORIAS ORDER BY NOME');
    res.render('dashboard/professor/p_criar_curso', {
      user: req.user,
      categorias,
      title: 'Criar Curso',
      success: req.flash('success'),
      error: req.flash('error')
    });
  } catch (err) {
    console.error('Erro ao buscar categorias:', err);
    req.flash('error', 'Erro ao carregar categorias!');
    res.render('dashboard/professor/p_criar_curso', {
      user: req.user,
      categorias: [],
      title: 'Criar Curso',
      success: req.flash('success'),
      error: req.flash('error')
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
    res.render('dashboard/professor/p-curso_prof', {
      user: req.user,
      cursos,
      title: 'Curso Professor',
      success: req.flash('success')
    });
  } catch (err) {
    console.error('Erro ao listar cursos:', err);
    req.flash('error', 'Erro ao buscar cursos!');
    res.render('dashboard/professor/p-curso_prof', {
      user: req.user || {},
      cursos: [],
      title: 'Curso Professor'
    });
  }
};

// Criação de curso
exports.criarCurso = async (req, res) => {
  try {
    const { titulo, descricao, categoria, preco, duracao_total, objetivos, modulos } = req.body;
    const professorId = req.user.ID_USUARIO || req.user.id; // compatível com diferentes auths
    if (!titulo || !descricao || !categoria || !preco || !duracao_total || !objetivos) {
      req.flash('error', 'Preencha todos os campos obrigatórios!');
      return res.redirect('/dashboard/professor/p_criar_curso');
    }
    // Busca o próximo ID_CURSO manualmente
    const [rows] = await db.query('SELECT MAX(ID_CURSO) as maxId FROM CURSOS');
    const nextId = (rows[0].maxId || 0) + 1;
    await db.query(
      'INSERT INTO CURSOS (ID_CURSO, TITULO, DESCRICAO, ID_CATEGORIA, ID_USUARIO, PRECO, DURACAO_TOTAL, OBJETIVOS, DATA_CRIACAO) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())',
      [nextId, titulo, descricao, categoria, professorId, preco, duracao_total, objetivos]
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
        'INSERT INTO MODULO (TITULO, DESCRICAO, ID_CURSO) VALUES (?, ?, ?)',
        [modulo.titulo, modulo.descricao, nextId]
      );
      const moduloId = moduloResult.insertId;
      // Cria aulas deste módulo
      if (modulo.aulas && Array.isArray(modulo.aulas)) {
        for (const aula of modulo.aulas) {
          await db.query(
            'INSERT INTO AULA (TITULO, DESCRICAO, ID_MODULO) VALUES (?, ?, ?)',
            [aula.titulo, aula.descricao, moduloId]
          );
        }
      }
    }
    req.flash('success', 'Curso criado com sucesso!');
    res.redirect('/dashboard/professor/p-curso_prof');
  } catch (err) {
    console.error('Erro ao criar curso:', err);
    req.flash('error', 'Erro ao criar curso!');
    res.redirect('/dashboard/professor/p_criar_curso');
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
      req.flash('error', 'Preencha todos os campos obrigatórios!');
      return res.redirect('/dashboard/professor/p-criar_aula');
    }
    await db.query(
      'INSERT INTO AULA (TITULO, DESCRICAO, ID_MODULO, VIDEO) VALUES (?, ?, ?, ?)',
      [titulo, descricao, modulo_id, videoPath]
    );
    req.flash('success', 'Aula criada com sucesso!');
    res.redirect('/dashboard/professor/p-modulo?moduloId=' + modulo_id);
  } catch (err) {
    console.error('Erro ao criar aula:', err);
    req.flash('error', 'Erro ao criar aula!');
    res.redirect('/dashboard/professor/p-criar_aula');
  }
};

// Atualizar curso por ID
exports.updateCursoById = async (req, res) => {
  try {
    const cursoId = req.params.id;
    const { titulo, descricao, categoria, preco, duracao_total, objetivos } = req.body;
    await db.query(
      `UPDATE CURSOS SET TITULO = ?, DESCRICAO = ?, ID_CATEGORIA = ?, PRECO = ?, DURACAO_TOTAL = ?, OBJETIVOS = ? WHERE ID_CURSO = ?`,
      [titulo, descricao, categoria, preco, duracao_total, objetivos, cursoId]
    );
    req.flash('success', 'Curso atualizado com sucesso!');
    res.redirect('/dashboard/professor/p_gere_curso/' + cursoId);
  } catch (err) {
    console.error('Erro ao atualizar curso:', err);
    req.flash('error', 'Erro ao atualizar curso!');
    res.redirect('/dashboard/professor/p_gere_curso/' + req.params.id);
  }
};

// Buscar curso por ID para edição
exports.getCursoById = async (req, res) => {
  try {
    const cursoId = req.params.id;
    const [rows] = await db.query(
      `SELECT c.*, cat.NOME as CATEGORIA, c.ID_CATEGORIA FROM CURSOS c LEFT JOIN CATEGORIAS cat ON c.ID_CATEGORIA = cat.ID_CATEGORIA WHERE c.ID_CURSO = ?`,
      [cursoId]
    );
    if (!rows || rows.length === 0) {
      req.flash('error', 'Curso não encontrado!');
      return res.redirect('/dashboard/professor/p-curso_prof');
    }
    const curso = rows[0];
    // Buscar módulos do curso
    const [modulos] = await db.query(
      `SELECT * FROM MODULO WHERE ID_CURSO = ?`,
      [cursoId]
    );
    res.render('dashboard/professor/p_gere_curso', {
      user: req.user,
      curso,
      modulos: modulos || [],
      title: 'Editar Curso'
    });
  } catch (err) {
    console.error('Erro ao buscar curso:', err);
    req.flash('error', 'Erro ao buscar curso!');
    res.redirect('/dashboard/professor/p-curso_prof');
  }
};

// Exclusão de curso
exports.excluirCurso = async (req, res) => {
  try {
    const cursoId = req.params.id;
    // Remove todas as aulas dos módulos deste curso
    await db.query('DELETE FROM AULA WHERE ID_MODULO IN (SELECT ID_MODULO FROM MODULO WHERE ID_CURSO = ?)', [cursoId]);
    // Remove todos os módulos do curso
    await db.query('DELETE FROM MODULO WHERE ID_CURSO = ?', [cursoId]);
    // Remove o curso
    await db.query('DELETE FROM CURSOS WHERE ID_CURSO = ?', [cursoId]);
    req.flash('success', 'Curso excluído com sucesso!');
    res.redirect('/dashboard/professor/p-curso_prof');
  } catch (err) {
    console.error('Erro ao excluir curso:', err);
    req.flash('error', 'Erro ao excluir curso!');
    res.redirect('/dashboard/professor/p_gere_curso/' + req.params.id);
  }
};

// Criação de módulo
exports.criarModulo = async (req, res) => {
  try {
    const { titulo, descricao } = req.body;
    // ID_CURSO pode vir via query ou session, ajuste conforme fluxo real
    const cursoId = req.query.cursoId || req.body.cursoId;
    if (!titulo || !descricao) {
      req.flash('error', 'Preencha todos os campos obrigatórios!');
      return res.redirect('/dashboard/professor/p-modulo');
    }
    if (!cursoId) {
      req.flash('error', 'Curso não identificado!');
      return res.redirect('/dashboard/professor/p-curso_prof');
    }
    const [result] = await db.query(
      'INSERT INTO MODULO (TITULO, DESCRICAO, ID_CURSO) VALUES (?, ?, ?)',
      [titulo, descricao, cursoId]
    );
    const moduloId = result.insertId;
    req.flash('success', 'Módulo criado com sucesso!');
    res.redirect(`/dashboard/professor/p-criar_aula?moduloId=${moduloId}`);
  } catch (err) {
    console.error('Erro ao criar módulo:', err);
    req.flash('error', 'Erro ao criar módulo!');
    res.redirect('/dashboard/professor/p-modulo');
  }
};
