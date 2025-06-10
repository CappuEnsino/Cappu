const multer = require("multer");
const path = require("path");

// Configuração de armazenamento em memória
const storage = multer.memoryStorage();

// Filtro de arquivo para permitir múltiplos tipos
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    // Imagens
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    // Vídeos
    "video/mp4",
    "video/mpeg",
    "video/quicktime",
    "video/x-msvideo", // avi
    "video/webm",
    // Documentos
    "application/pdf",
    "application/msword", // .doc
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
    "application/vnd.ms-powerpoint", // .ppt
    "application/vnd.openxmlformats-officedocument.presentationml.presentation", // .pptx
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    console.error(`Tipo de arquivo não permitido: ${file.mimetype}`);
    cb(new Error("Tipo de arquivo não suportado! Por favor, envie imagens, vídeos, PDFs ou apresentações."), false);
  }
};

// Configuração do upload
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB
  },
});

module.exports = upload;
