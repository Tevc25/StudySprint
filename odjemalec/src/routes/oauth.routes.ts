// OAuth rute - POST /oauth/token za pridobivanje Bearer tokenov
import { Router } from 'express';
import { issueAccessToken } from '../controllers/oauth.controller';

export const oauthRouter = Router();

oauthRouter.post('/token', issueAccessToken);
