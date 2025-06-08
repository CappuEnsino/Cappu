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

// Dashboard principal do admin
router.get('/', isAdmin, (req, res) => {
  res.render('dashboard/adm/adm-dashboard', {
    user: req.user,
    title: 'Painel Administrativo'
  });
});

// Outras telas administrativas
router.get('/adm-g-usuarios', isAdmin, (req, res) => {
  res.render('dashboard/adm/adm-g-usuarios', {
    user: req.user,
    title: 'Gerenciar Usuários'
  });
});

router.get('/adm-financeiro', isAdmin, (req, res) => {
  res.render('dashboard/adm/adm-financeiro', {
    user: req.user,
    title: 'Financeiro'
  });
});

router.get('/adm-g-cursos', isAdmin, (req, res) => {
  res.render('dashboard/adm/adm-g-cursos', {
    user: req.user,
    title: 'Gerenciar Cursos'
  });
});

router.get('/adm-suporte', isAdmin, (req, res) => {
  res.render('dashboard/adm/adm-suporte', {
    user: req.user,
    title: 'Suporte'
  });
});

router.get('/adm-painel', isAdmin, (req, res) => {
  res.render('dashboard/adm/adm-painel', {
    user: req.user,
    title: 'Painel de Controle'
  });
});

module.exports = router;
