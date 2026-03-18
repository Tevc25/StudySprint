import { Router } from 'express';
import { apiRouter } from './api';
import { contentRouter } from './content.routes';

export const rootRouter = Router();

rootRouter.use(contentRouter);
rootRouter.use('/api', apiRouter);
