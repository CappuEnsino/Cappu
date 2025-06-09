const express = require('express');
const router = express.Router();

// Middleware para garantir que só admins acessem
function isAdmin(req, res, next) {
  if (req.user && req.user.TIPO_USUARIO === 'admin') {
    return next();
  }
  req.flash('error', 'Acesso restrito!');
  res.redirect('/auth/login');
}

// Rota principal do admin
router.get('/', isAdmin, (req, res) => {
  res.render('dashboard/adm/adm-painel', {
    user: req.user,
    title: 'Painel de Controle'
  });
});

// Rota para o painel de controle
router.get('/adm-painel', isAdmin, (req, res) => {
  res.render('dashboard/adm/adm-painel', {
    user: req.user,
    title: 'Painel de Controle'
  });
});

// Rota para gerenciamento de usuários
router.get('/adm-g-usuarios', isAdmin, (req, res) => {
  res.render('dashboard/adm/adm-g-usuarios', {
    user: req.user,
    title: 'Gerenciar Usuários'
  });
});

// Rota para gerenciamento de cursos
router.get('/adm-g-cursos', isAdmin, (req, res) => {
  res.render('dashboard/adm/adm-g-cursos', {
    user: req.user,
    title: 'Gerenciar Cursos'
  });
});

// Rota para financeiro
router.get('/adm-financeiro', isAdmin, (req, res) => {
  res.render('dashboard/adm/adm-financeiro', {
    user: req.user,
    title: 'Financeiro'
  });
});

// Rota para suporte
router.get('/adm-suporte', isAdmin, (req, res) => {
  res.render('dashboard/adm/adm-suporte', {
    user: req.user,
    title: 'Suporte'
  });
});

module.exports = router;
