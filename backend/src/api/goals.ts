import { Router, Request, Response } from 'express';
import * as svc from '../services/goalService';

const router = Router();

// GET /goals
router.get('/', async (_req: Request, res: Response) => {
  const goals = await svc.getAllGoals();
  res.json(goals);
});

// GET /goals/:id
router.get('/:id', async (req: Request, res: Response) => {
  const goal = await svc.getGoalById(req.params.id);
  if (!goal) return res.status(404).json({ error: 'Cilj ni najden' });
  res.json(goal);
});

// POST /goals
router.post('/', async (req: Request, res: Response) => {
  const { title, description, deadline, userId, status } = req.body;
  if (!title || !userId) {
    return res.status(400).json({ error: 'Manjkajo obvezna polja: title, userId' });
  }
  const goal = await svc.createGoal({ title, description, deadline, userId, status: status ?? 'active' });
  res.status(201).json(goal);
});

// PUT /goals/:id
router.put('/:id', async (req: Request, res: Response) => {
  const updated = await svc.updateGoal(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Cilj ni najden' });
  res.json(updated);
});

// DELETE /goals/:id
router.delete('/:id', async (req: Request, res: Response) => {
  const ok = await svc.deleteGoal(req.params.id);
  if (!ok) return res.status(404).json({ error: 'Cilj ni najden' });
  res.json({ message: 'Cilj izbrisan' });
});

export default router;
