import { Router, Request, Response } from 'express';
import * as svc from '../services/taskService';

const router = Router();

// GET /tasks
router.get('/', async (_req: Request, res: Response) => {
  const tasks = await svc.getAllTasks();
  res.json(tasks);
});

// GET /tasks/:id
router.get('/:id', async (req: Request, res: Response) => {
  const task = await svc.getTaskById(req.params.id);
  if (!task) return res.status(404).json({ error: 'Naloga ni najdena' });
  res.json(task);
});

// POST /tasks
router.post('/', async (req: Request, res: Response) => {
  const { title, description, deadline, goalId, userId, completed } = req.body;
  if (!title || !userId) {
    return res.status(400).json({ error: 'Manjkajo obvezna polja: title, userId' });
  }
  const task = await svc.createTask({ title, description, deadline, goalId, userId, completed: completed ?? false });
  res.status(201).json(task);
});

// PUT /tasks/:id
router.put('/:id', async (req: Request, res: Response) => {
  const updated = await svc.updateTask(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Naloga ni najdena' });
  res.json(updated);
});

// DELETE /tasks/:id
router.delete('/:id', async (req: Request, res: Response) => {
  const ok = await svc.deleteTask(req.params.id);
  if (!ok) return res.status(404).json({ error: 'Naloga ni najdena' });
  res.json({ message: 'Naloga izbrisana' });
});

export default router;
