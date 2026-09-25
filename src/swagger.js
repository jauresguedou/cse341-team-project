import swaggerJsdoc from 'swagger-jsdoc';
import Path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = Path.dirname(__filename);

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Kizuna Rail API',
      version: '1.0.0',
    },
  },
  apis: [Path.join(__dirname, 'routes', '*.js').split(Path.sep).join('/')], // wherever your @swagger comments live
};

export const swaggerSpec = swaggerJsdoc(options);