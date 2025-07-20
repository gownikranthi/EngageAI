const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'EngageAI API',
      version: '1.0.0',
      description: 'API documentation for EngageAI platform',
    },
    servers: [
      {
        url: '/api/v1',
        description: 'Local server'
      }
    ],
  },
  apis: ['./routes/*.js'], // Path to the API docs
};

const specs = swaggerJsdoc(swaggerOptions);

module.exports = {
  swaggerUi,
  specs,
}; 