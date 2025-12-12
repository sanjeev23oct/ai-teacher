import swaggerJsdoc from 'swagger-jsdoc';
import path from 'path';

export const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'AI Teacher API',
      version: '1.0.0',
      description: 'API documentation for AI Teacher platform',
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Development server',
      },
      {
        url: 'https://studybuddy.aitutor.cloud',
        description: 'Production server (primary)',
      },
      {
        url: 'https://ai-teacher-production.up.railway.app',
        description: 'Production server (Railway)',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: [
    path.join(__dirname, 'swagger-docs.ts'),
    path.join(__dirname, 'swagger-docs.js'),
  ],
};

export const swaggerSpec = swaggerJsdoc(swaggerOptions);
