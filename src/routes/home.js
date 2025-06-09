const express = require("express");
const router = express.Router();
const db = require("../config/database");
const pool = require("../config/database");

// Rotas da Home
router.get("/", (req, res) => {
  res.render("pages/home/index");
});

router.get("/quemsomos", (req, res) => {
  res.render("pages/home/quemsomos");
});

router.get("/cursos", async (req, res) => {
  try {
    const [cursos] = await db.query(`
      SELECT c.ID_CURSO, c.TITULO, c.DURACAO_TOTAL, c.IMAGEM, c.DESCRICAO
      FROM CURSOS c
      ORDER BY c.ID_CURSO ASC
      LIMIT 6
    `);

    res.render("pages/home/cursos", {
      cursos: cursos || []
    });
  } catch (err) {
    console.error("Erro ao buscar cursos:", err);
    res.render("pages/home/cursos", {
      cursos: []
    });
  }
});

router.get("/planos", (req, res) => {
  res.render("pages/home/planos");
});

router.get("/sou-aluno", (req, res) => {
  res.render("pages/home/sou-aluno");
});

router.get("/sou-professor", (req, res) => {
  res.render("pages/home/sou-professor");
});

router.get("/fale-conosco", (req, res) => {
  res.render("pages/home/fale-conosco");
});

// Rotas Institucionais
router.get("/institucional/inst-seguranca", (req, res) => {
  res.render("pages/institucional/inst-seguranca");
});

router.get("/institucional/inst-acessibilidade", (req, res) => {
  res.render("pages/institucional/inst-acessibilidade");
});

router.get("/institucional/inst-privacidade", (req, res) => {
  res.render("pages/institucional/inst-privacidade");
});

router.get("/institucional/inst-termos-de-uso", (req, res) => {
  res.render("pages/institucional/inst-termos-de-uso");
});

router.get("/curso/:id", async (req, res) => {
  try {
    console.log('=== INÍCIO DA REQUISIÇÃO ===');
    console.log('ID do curso solicitado:', req.params.id);

    // Primeiro, vamos verificar se o curso existe
    const [cursoCheck] = await pool.query(
      'SELECT ID_CURSO, PRECO, TITULO FROM CURSOS WHERE ID_CURSO = ?',
      [req.params.id]
    );
    console.log('Verificação inicial do curso:', JSON.stringify(cursoCheck, null, 2));

    if (cursoCheck.length === 0) {
      console.log('Curso não encontrado no banco de dados');
      return res.redirect('/cursos');
    }

    // Agora vamos buscar os detalhes completos
    const query = `
      SELECT 
        c.*,
        u.NOME_USU as NOME_PROFESSOR,
        cat.NOME as NOME_CATEGORIA
      FROM CURSOS c 
      LEFT JOIN USUARIO u ON c.ID_USUARIO = u.ID_USUARIO 
      LEFT JOIN CATEGORIAS cat ON c.ID_CATEGORIA = cat.ID_CATEGORIA
      WHERE c.ID_CURSO = ?
    `;
    
    console.log('Executando query:', query);
    console.log('Parâmetros:', [req.params.id]);

    const [cursos] = await pool.query(query, [req.params.id]);
    console.log('Resultado da query:', JSON.stringify(cursos, null, 2));

    if (cursos.length === 0) {
      console.log('Nenhum curso encontrado após a query completa');
      return res.redirect('/cursos');
    }

    const curso = cursos[0];
    console.log('Dados brutos do curso:', JSON.stringify(curso, null, 2));

    // Formata os dados do curso
    const cursoFormatado = {
      ...curso,
      PRECO: curso.PRECO ? parseFloat(curso.PRECO) : 0,
      DURACAO_TOTAL: curso.DURACAO_TOTAL || 'Não definida',
      DESCRICAO: curso.DESCRICAO || 'Sem descrição',
      OBJETIVOS: curso.OBJETIVOS || 'Sem objetivos definidos',
      NOME_PROFESSOR: curso.NOME_PROFESSOR || 'Professor não definido',
      NOME_CATEGORIA: curso.NOME_CATEGORIA || 'Categoria não definida',
      TITULO: curso.TITULO || 'Curso sem título'
    };

    console.log('Dados formatados do curso:', JSON.stringify(cursoFormatado, null, 2));

    // Busca módulos do curso
    const [modulos] = await pool.query(
      'SELECT * FROM MODULO WHERE ID_CURSO = ? ORDER BY ORDEM',
      [req.params.id]
    );
    console.log('Módulos encontrados:', modulos.length);

    // Para cada módulo, busca suas aulas
    for (let modulo of modulos) {
      const [aulas] = await pool.query(
        'SELECT * FROM AULA WHERE ID_MODULO = ? ORDER BY ORDEM',
        [modulo.ID_MODULO]
      );
      modulo.aulas = aulas;
      console.log(`Módulo ${modulo.ID_MODULO}: ${aulas.length} aulas encontradas`);
    }

    // Verifica se o usuário comprou o curso
    let cursoComprado = false;
    if (req.user) {
      const [compra] = await pool.query(
        `SELECT * FROM CURSOS_COMPRA 
         WHERE ID_COMPRA IN (
           SELECT ID_COMPRA FROM COMPRA WHERE ID_USUARIO = ?
         ) AND ID_CURSO = ?`,
        [req.user.ID_USUARIO, req.params.id]
      );
      cursoComprado = compra ? true : false;
      console.log('Status de compra do curso:', cursoComprado);
    }

    console.log('Renderizando página com dados:', {
      curso: cursoFormatado,
      modulos: modulos.length,
      cursoComprado,
      user: req.user ? 'Usuário autenticado' : 'Usuário não autenticado'
    });

    res.render('pages/courses/c-curso', {
      curso: cursoFormatado,
      modulos,
      cursoComprado,
      user: req.user
    });
  } catch (error) {
    console.error('Erro detalhado ao carregar curso:', error);
    res.redirect('/cursos');
  }
});

router.get('/error', (req, res) => {
  const message = req.query.message || 'Ocorreu um erro inesperado';
  res.render('pages/error', { message });
});

module.exports = router; 