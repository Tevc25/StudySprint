import { Router } from 'express';
import { issueAccessToken } from '../controllers/oauth.controller';

export const oauthRouter = Router();

oauthRouter.post('/token', issueAccessToken);
