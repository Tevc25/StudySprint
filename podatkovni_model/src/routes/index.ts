import { Router } from 'express';
import { apiRouter } from './api';
import { contentRouter } from './content.routes';
import { oauthRouter } from './oauth.routes';

export const rootRouter = Router();

rootRouter.use(contentRouter);
rootRouter.use('/oauth', oauthRouter);
rootRouter.use('/api', apiRouter);
