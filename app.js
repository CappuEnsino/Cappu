// Carregar variáveis de ambiente primeiro
require('dotenv').config();

const express = require("express");
const path = require("path");
const session = require("express-session");
const flash = require("connect-flash");
const passport = require("passport");
const cookieParser = require("cookie-parser");

const app = express();

// Configuração do banco com mysql2
const db = require("./src/config/database");

// Inicializa estratégias do Passport
require("./src/controller/passport");

// ======================
// Configurações Essenciais
// ======================
app.set("view engine", "ejs");
app.set("views", "src/views");
app.use(express.static("./public"));

// ======================
// Middlewares
// ======================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(
  session({
    secret: process.env.SESSION_SECRET || "sua_chave_secreta_segura",
    resave: false,
    saveUninitialized: false,
  })
);

app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

// Flash messages globais
app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  next();
});

// ======================
// Rotas
// ======================
app.use("/", require("./src/routes/home"));
app.use("/auth", require("./src/routes/auth"));
app.use("/aluno", require("./src/routes/aluno"));
app.use("/professor", require("./src/routes/professor"));
app.use("/dashboard/professor", require("./src/routes/professor"));
app.use("/admin", require("./src/routes/admin"));

app.get("/login", (req, res) => res.redirect("/auth/login"));
app.get("/cadastro", (req, res) => res.redirect("/auth/register"));

app.get("/institucional/:pagina", (req, res) => {
  const viewPage = `inst-${req.params.pagina}`;
  res.render(`pages/institucional/${viewPage}`);
});

// ======================
// Inicia servidor após conexão com banco
// ======================
async function startServer() {
  try {
    // Testa conexão
    await db.execute("SELECT 1"); // Simples verificação de conexão
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`✅ Servidor rodando na porta ${PORT}`);
      console.log(`🔗 http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("❌ Erro ao conectar com o banco de dados:", error);
  }
}

startServer();
