const mysql = require("mysql2");
const env = require("dotenv").config();

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 20, // Aumentando para 20 conexões
  queueLimit: 0,
  maxIdle: 10, // Número máximo de conexões inativas
  idleTimeout: 60000, // Tempo de inatividade antes de fechar conexão (60 segundos)
  acquireTimeout: 60000, // Tempo máximo para adquirir uma conexão (60 segundos)
  timeout: 60000 // Tempo máximo para uma consulta (60 segundos)
});

db.getConnection((err, conn) => {
  if(err) 
      console.log(err)
  else
      console.log("Conectado ao SGBD!")
})

module.exports = db.promise()
