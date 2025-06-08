const express = require("express");
const router = express.Router();
const upload = require("../config/multer");
const professorController = require("../controller/professorController");
const db = require("../config/database");

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

router.get("/p-criar_aula", (req, res) => {
  res.render("dashboard/professor/p-criar_aula", {
    user: req.user,
    title: "Criar Aula",
  });
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
router.post("/p-criar_aula", professorController.criarAula);

// Rota para exclusão de curso
router.post("/excluir_curso/:id", professorController.excluirCurso);

// Rota para atualização completa de curso, módulos e aulas (sem AJAX)
router.post(
  "/p_gere_curso_completo/:id",
  upload.single("imagem"),
  professorController.atualizarCursoCompleto
);

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

module.exports = router;
