import { Router, Request, Response } from 'express';
import * as svc from '../services/groupService';

const router = Router();

// GET /groups
router.get('/', async (_req: Request, res: Response) => {
  const groups = await svc.getAllGroups();
  res.json(groups);
});

// GET /groups/:id
router.get('/:id', async (req: Request, res: Response) => {
  const group = await svc.getGroupById(req.params.id);
  if (!group) return res.status(404).json({ error: 'Skupina ni najdena' });
  res.json(group);
});

// POST /groups
router.post('/', async (req: Request, res: Response) => {
  const { name, description, moderatorId } = req.body;
  if (!name || !moderatorId) {
    return res.status(400).json({ error: 'Manjkajo obvezna polja: name, moderatorId' });
  }
  const group = await svc.createGroup({ name, description, moderatorId, members: [] });
  res.status(201).json(group);
});

// PUT /groups/:id
router.put('/:id', async (req: Request, res: Response) => {
  const updated = await svc.updateGroup(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Skupina ni najdena' });
  res.json(updated);
});

// DELETE /groups/:id
router.delete('/:id', async (req: Request, res: Response) => {
  const ok = await svc.deleteGroup(req.params.id);
  if (!ok) return res.status(404).json({ error: 'Skupina ni najdena' });
  res.json({ message: 'Skupina izbrisana' });
});

// POST /groups/:id/join
router.post('/:id/join', async (req: Request, res: Response) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'Manjka: userId' });
  const group = await svc.joinGroup(req.params.id, userId);
  if (!group) return res.status(404).json({ error: 'Skupina ni najdena' });
  res.json({ message: 'Uspešno pridružen skupini', group });
});

// POST /groups/:id/members
router.post('/:id/members', async (req: Request, res: Response) => {
  const { userIds } = req.body;
  if (!userIds || !Array.isArray(userIds)) {
    return res.status(400).json({ error: 'Manjka: userIds (array)' });
  }
  const group = await svc.addMembers(req.params.id, userIds);
  if (!group) return res.status(404).json({ error: 'Skupina ni najdena' });
  res.json({ message: 'Člani dodani', group });
});

// GET /groups/:id/members
router.get('/:id/members', async (req: Request, res: Response) => {
  const members = await svc.getMembers(req.params.id);
  if (members === null) return res.status(404).json({ error: 'Skupina ni najdena' });
  res.json({ members });
});

export default router;
