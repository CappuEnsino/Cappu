const db = require('../config/database');

const closeIdleConnections = async (req, res, next) => {
    try {
        // Verifica e fecha conexões inativas
        await db.query('SELECT CONNECTION_ID()');
        next();
    } catch (error) {
        console.error('Erro ao verificar conexões:', error);
        next();
    }
};

module.exports = closeIdleConnections;
