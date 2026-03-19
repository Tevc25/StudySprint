import { Router } from 'express';
import usersRouter from './users';
import goalsRouter from './goals';
import tasksRouter from './tasks';
import groupsRouter from './groups';
import challengesRouter from './challenges';
import notificationsRouter from './notifications';
import progressRouter from './progress';

const router = Router();

router.use('/users', usersRouter);
router.use('/goals', goalsRouter);
router.use('/tasks', tasksRouter);
router.use('/groups', groupsRouter);
router.use('/challenges', challengesRouter);
router.use('/notifications', notificationsRouter);
router.use('/progress', progressRouter);

export default router;
