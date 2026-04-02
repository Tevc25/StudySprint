import { Router, Request, Response } from 'express';
import * as userSvc from '../services/userService';
import { generateToken, EXPIRES_IN_SECONDS } from '../auth/tokenService';

const router = Router();

/**
 * POST /auth/token
 * OAuth 2.0 – Resource Owner Password Credentials Grant
 *
 * Body (application/json ali application/x-www-form-urlencoded):
 *   grant_type : "password"
 *   username   : email uporabnika
 *   password   : geslo
 *   client_id  : identifikator odjemalca (neobvezno)
 *
 * Odgovor:
 *   { access_token, token_type: "Bearer", expires_in }
 */
router.post('/token', async (req: Request, res: Response) => {
  const { grant_type, username, password } = req.body;

  if (grant_type !== 'password') {
    res.status(400).json({
      error: 'unsupported_grant_type',
      error_description: 'Podprt je samo grant_type=password',
    });
    return;
  }

  if (!username || !password) {
    res.status(400).json({
      error: 'invalid_request',
      error_description: 'Manjkata parametra username in password',
    });
    return;
  }

  const user = await userSvc.loginUser(username as string, password as string);
  if (!user) {
    res.status(401).json({
      error: 'invalid_client',
      error_description: 'Napačni prijavni podatki',
    });
    return;
  }

  const access_token = generateToken({
    sub: user.id!,
    email: user.email,
    role: user.role,
  });

  res.json({
    access_token,
    token_type: 'Bearer',
    expires_in: EXPIRES_IN_SECONDS,
  });
});

export default router;
