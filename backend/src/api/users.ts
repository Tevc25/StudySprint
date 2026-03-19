import { Router, Request, Response } from 'express';
import * as svc from '../services/userService';

const router = Router();

// GET /users
router.get('/', async (_req: Request, res: Response) => {
  const users = await svc.getAllUsers();
  res.json(users);
});

// GET /users/:id
router.get('/:id', async (req: Request, res: Response) => {
  const user = await svc.getUserById(req.params.id);
  if (!user) return res.status(404).json({ error: 'Uporabnik ni najden' });
  res.json(user);
});

// POST /users  (registracija)
router.post('/', async (req: Request, res: Response) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Manjkajo obvezna polja: name, email, password' });
  }
  const user = await svc.createUser({ name, email, password, role: role ?? 'user' });
  res.status(201).json(user);
});

// POST /users/login  (prijava)
router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Manjkajo: email, password' });
  }
  const user = await svc.loginUser(email, password);
  if (!user) return res.status(401).json({ error: 'Napačni prijavni podatki' });
  res.json({ message: 'Prijava uspešna', user });
});

// PUT /users/:id
router.put('/:id', async (req: Request, res: Response) => {
  const updated = await svc.updateUser(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Uporabnik ni najden' });
  res.json(updated);
});

// DELETE /users/:id
router.delete('/:id', async (req: Request, res: Response) => {
  const ok = await svc.deleteUser(req.params.id);
  if (!ok) return res.status(404).json({ error: 'Uporabnik ni najden' });
  res.json({ message: 'Uporabnik izbrisan' });
});

export default router;
