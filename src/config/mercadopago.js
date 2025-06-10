const { MercadoPagoConfig, Preference } = require('mercadopago');

// Configuração do Mercado Pago
const client = new MercadoPagoConfig({ 
    accessToken: process.env.MP_ACCESS_TOKEN 
});

const preference = new Preference(client);

module.exports = { client, preference }; 