import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Kizuna Rail API',
      version: '1.0.0',
    },
  },
  apis: ['./src/routes/*.js'], // wherever your @swagger comments live
};

export const swaggerSpec = swaggerJsdoc(options);