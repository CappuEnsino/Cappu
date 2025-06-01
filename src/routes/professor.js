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

router.get("/p-curso_prof", (req, res) => {
  res.render("dashboard/professor/p-curso_prof", {
    user: req.user,
    title: "Curso Professor",
  });
});

router.get("/p-criar_aula", (req, res) => {
  res.render("dashboard/professor/p-criar_aula", {
    user: req.user,
    title: "Criar Aula",
  });
});

router.get("/p-criar_exer", (req, res) => {
  res.render("dashboard/professor/p-criar_exer", {
    user: req.user,
    title: "Criar Exercício",
  });
});

router.get("/p_criar_curso", (req, res) => {
  res.render("dashboard/professor/p_criar_curso", {
    user: req.user,
    title: "Criar Curso",
  });
});

router.get("/p_criar_mat", (req, res) => {
  res.render("dashboard/professor/p_criar_mat", {
    user: req.user,
    title: "Criar Material",
  });
});



// Rotas de cursos
router.get("/curso/new", (req, res) => {
  res.render("dashboard/professor/p_criar_curso", {
    user: req.user,
    title: "Criar Curso",
  });
});

router.post("/curso/save", upload.single("imagem"), (req, res) => {
  // Lógica para salvar curso
});

// Rotas de aulas
router.get("/aula/new", (req, res) => {
  res.render("dashboard/professor/p-criar_aula", {
    user: req.user,
    title: "Criar Aula",
  });
});

router.post("/aula/save", upload.single("video"), (req, res) => {
  // Lógica para salvar aula
});

// Rotas de exercícios
router.get("/exercicio/new", (req, res) => {
  res.render("dashboard/professor/p_criar_exer", {
    user: req.user,
    title: "Criar Exercício",
  });
});

router.post("/exercicio/save", (req, res) => {
  // Lógica para salvar exercício
});

module.exports = router;
