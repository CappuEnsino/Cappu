module.exports = {
  isLoggedIn: (req, res, next) => {
    if (req.isAuthenticated()) return next();
    req.flash("error", "Faça login primeiro");
    res.redirect("/auth/login");
  },

  isNotLoggedIn: (req, res, next) => {
    if (!req.isAuthenticated()) return next();
    res.redirect("/");
  },

  isAuthenticated: (req, res, next) => {
    if (req.isAuthenticated()) {
      return next();
    }
    req.flash("error", "Você precisa estar logado para acessar esta página");
    res.redirect("/login");
  },

  isProfessor: (req, res, next) => {
    if (req.isAuthenticated() && req.user.role === "professor") {
      return next();
    }
    req.flash("error", "Acesso restrito a professores");
    res.redirect("/login");
  },

  isAluno: (req, res, next) => {
    if (req.isAuthenticated() && req.user.role === "aluno") {
      return next();
    }
    req.flash("error", "Acesso restrito a alunos");
    res.redirect("/dashboard");
  },
};
