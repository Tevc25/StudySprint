import { Router, Request, Response } from 'express';
import { getTasksByUser } from '../services/taskService';
import { getGoalsByUser, getGoalById } from '../services/goalService';
import { getTasksByGoal } from '../services/taskService';

const router = Router();

// GET /progress/:userId
router.get('/:userId', async (req: Request, res: Response) => {
  const { userId } = req.params;
  const tasks = await getTasksByUser(userId);
  const goals = await getGoalsByUser(userId);

  const completed = tasks.filter(t => t.completed).length;
  const total = tasks.length;
  const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);
  const completedGoals = goals.filter(g => g.status === 'completed').length;

  res.json({
    userId,
    tasks: { total, completed, pending: total - completed },
    goals: { total: goals.length, completed: completedGoals },
    progressPercentage: percentage,
  });
});

// GET /progress/goal/:goalId
router.get('/goal/:goalId', async (req: Request, res: Response) => {
  const { goalId } = req.params;
  const goal = await getGoalById(goalId);
  if (!goal) return res.status(404).json({ error: 'Cilj ni najden' });

  const tasks = await getTasksByGoal(goalId);
  const completed = tasks.filter(t => t.completed).length;
  const total = tasks.length;
  const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);

  res.json({
    goalId,
    goalTitle: goal.title,
    goalStatus: goal.status,
    tasks: { total, completed, pending: total - completed },
    progressPercentage: percentage,
  });
});

export default router;
