import express from 'express';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import { openApiSpec } from './docs/openapi';
import { errorHandler } from './middleware/error-handler';
import { notFoundHandler } from './middleware/not-found';
import { rootRouter } from './routes';

const publicDir = path.resolve(process.cwd(), 'public');
const erDir = path.resolve(process.cwd(), 'ER');

export const app = express();

// CORS – allow all origins so the PWA can call the API regardless of port
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(publicDir));
app.use('/images', express.static(path.join(publicDir, 'images')));
app.use('/styles', express.static(path.join(publicDir, 'styles')));
app.use('/ER', express.static(erDir));
app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(openApiSpec, {
    swaggerOptions: {
      persistAuthorization: true
    }
  })
);
app.get('/api-docs.json', (_req, res) => {
  res.json(openApiSpec);
});

app.use(rootRouter);
app.use(notFoundHandler);
app.use(errorHandler);
