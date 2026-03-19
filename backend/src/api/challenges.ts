import { Router, Request, Response } from 'express';
import * as svc from '../services/challengeService';

const router = Router();

// GET /challenges
router.get('/', async (_req: Request, res: Response) => {
  const challenges = await svc.getAllChallenges();
  res.json(challenges);
});

// GET /challenges/:id
router.get('/:id', async (req: Request, res: Response) => {
  const challenge = await svc.getChallengeById(req.params.id);
  if (!challenge) return res.status(404).json({ error: 'Izziv ni najden' });
  res.json(challenge);
});

// POST /challenges
router.post('/', async (req: Request, res: Response) => {
  const { title, description, groupId, startDate, endDate } = req.body;
  if (!title || !groupId) {
    return res.status(400).json({ error: 'Manjkajo obvezna polja: title, groupId' });
  }
  const challenge = await svc.createChallenge({ title, description, groupId, startDate, endDate, isActive: false, participants: [] });
  res.status(201).json(challenge);
});

// PUT /challenges/:id
router.put('/:id', async (req: Request, res: Response) => {
  const updated = await svc.updateChallenge(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Izziv ni najden' });
  res.json(updated);
});

// DELETE /challenges/:id
router.delete('/:id', async (req: Request, res: Response) => {
  const ok = await svc.deleteChallenge(req.params.id);
  if (!ok) return res.status(404).json({ error: 'Izziv ni najden' });
  res.json({ message: 'Izziv izbrisan' });
});

// POST /challenges/:id/start
router.post('/:id/start', async (req: Request, res: Response) => {
  const challenge = await svc.startChallenge(req.params.id);
  if (!challenge) return res.status(404).json({ error: 'Izziv ni najden' });
  res.json({ message: 'Izziv zagnan', challenge });
});

// POST /challenges/:id/participate
router.post('/:id/participate', async (req: Request, res: Response) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'Manjka: userId' });
  const challenge = await svc.participateInChallenge(req.params.id, userId);
  if (!challenge) return res.status(404).json({ error: 'Izziv ni najden' });
  res.json({ message: 'Sodelovanje zabeleženo', challenge });
});

export default router;
