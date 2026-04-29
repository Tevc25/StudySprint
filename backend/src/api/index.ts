import { Router } from 'express';
import { requireAuth } from '../auth/middleware';
import authRouter from './auth';
import usersRouter from './users';
import goalsRouter from './goals';
import tasksRouter from './tasks';
import groupsRouter from './groups';
import challengesRouter from './challenges';
import notificationsRouter from './notifications';
import progressRouter from './progress';
import pushRouter from './push';

const router = Router();

// Javne poti (brez avtentikacije)
router.use('/auth', authRouter);
router.use('/users', usersRouter);

// Zaščitene poti – zahtevajo veljavni Bearer žeton
router.use('/goals', requireAuth, goalsRouter);
router.use('/tasks', requireAuth, tasksRouter);
router.use('/groups', requireAuth, groupsRouter);
router.use('/challenges', requireAuth, challengesRouter);
router.use('/notifications', requireAuth, notificationsRouter);
router.use('/progress', requireAuth, progressRouter);
router.use('/push', pushRouter);

export default router;
