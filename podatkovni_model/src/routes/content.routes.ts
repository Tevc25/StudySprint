import { Router } from 'express';
import path from 'path';
import { restRouteContractText } from './api/route-contract';

const publicDir = path.resolve(process.cwd(), 'public');

export const contentRouter = Router();

contentRouter.get('/', (_req, res) => {
  res.redirect('/podatkovni-model/');
});

contentRouter.get('/podatkovni-model/', (_req, res) => {
  res.sendFile(path.join(publicDir, 'podatkovni-model.html'));
});

contentRouter.get('/REST/', (_req, res) => {
  res.type('text/plain; charset=utf-8').send(restRouteContractText);
});
