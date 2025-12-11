const swaggerJsdoc = require('swagger-jsdoc');
const path = require('path');

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'AI Teacher API',
      version: '1.0.0',
      description: 'API documentation for AI Teacher platform',
    },
  },
  apis: [path.join(__dirname, 'index.ts')],
};

const spec = swaggerJsdoc(swaggerOptions);
console.log('Paths found:', Object.keys(spec.paths || {}));
console.log('\nFull spec paths:', JSON.stringify(spec.paths, null, 2));
