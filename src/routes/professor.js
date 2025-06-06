const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");

// Configuração do Multer para upload de arquivos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });


// Dashboard do professor
router.get("/p-professor", (req, res) => {
  res.render("dashboard/professor/p-professor", {
    user: req.user,
    title: "Dashboard Professor",
  });
});

router.get("/p-config", (req, res) => {
  res.render("dashboard/professor/p-config", {
    user: req.user,
    title: "Configurações",
  });
});

router.get("/p-minha-rotina", (req, res) => {
  res.render("dashboard/professor/p-minha-rotina", {
    user: req.user,
    title: "Minha Rotina",
  });
});

router.get("/p_gere_curso", (req, res) => {
  res.render("dashboard/professor/p_gere_curso", {
    user: req.user,
    title: "Gerenciar Cursos",
  });
});

const professorController = require('../controller/professorController');
// Rota para editar curso pelo ID
router.get("/p_gere_curso/:id", professorController.getCursoById);
// Rota para atualizar curso pelo ID
router.post("/p_gere_curso/:id", professorController.updateCursoById);
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

router.get('/p_criar_curso', professorController.getCriarCursoPage);

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

router.post('/p_criar_curso', professorController.criarCurso);
router.post('/p-modulo', professorController.criarModulo);
router.post('/p-criar_aula', professorController.criarAula);

// Rota para exclusão de curso
router.post('/excluir_curso/:id', professorController.excluirCurso);

module.exports = router;
