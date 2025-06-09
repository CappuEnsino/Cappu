const mysql = require("mysql2");
const env = require("dotenv").config();

const db = mysql.createPool({
  host: process.env.DB_HOST ,
  user: process.env.DB_USER ,
  password: process.env.DB_PASS ,
  database: process.env.DB_NAME ,
  waitForConnections: true,
    connectionLimit: 5,
    queueLimit: 0
});

db.getConnection((err, conn) => {
  if(err) 
      console.log(err)
  else
      console.log("Conectado ao SGBD!")
})

module.exports = db.promise()
