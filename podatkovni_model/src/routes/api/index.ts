import { Router } from 'express';
import { CrudController } from '../../controllers/crud.controller';
import { finishSprint, patchTaskStatus, syncData } from '../../controllers/special.controller';
import { domainServices } from '../../services/domain-services';
import { asyncHandler } from '../../utils/async-handler';

export const apiRouter = Router();

const subjectsController = new CrudController('Subject', domainServices.subjectService);
const goalsController = new CrudController('Goal', domainServices.goalService);
const tasksController = new CrudController('Task', domainServices.taskService);
const sprintsController = new CrudController('StudySprint', domainServices.sprintService);
const progressController = new CrudController('Progress', domainServices.progressService);
const remindersController = new CrudController('Reminder', domainServices.reminderService);
const groupsController = new CrudController('Group', domainServices.groupService);
const groupMembershipsController = new CrudController(
  'GroupMembership',
  domainServices.groupMembershipService
);
const groupChallengesController = new CrudController(
  'GroupChallenge',
  domainServices.groupChallengeService
);

const registerStandardCrud = (
  basePath: string,
  controller: CrudController<any, any, any>
): void => {
  apiRouter.get(basePath, asyncHandler(controller.getAll));
  apiRouter.get(`${basePath}/:id`, asyncHandler(controller.getById));
  apiRouter.post(basePath, asyncHandler(controller.create));
  apiRouter.put(`${basePath}/:id`, asyncHandler(controller.update));
  apiRouter.delete(`${basePath}/:id`, asyncHandler(controller.remove));
};

registerStandardCrud('/subjects', subjectsController);
registerStandardCrud('/goals', goalsController);
registerStandardCrud('/tasks', tasksController);
registerStandardCrud('/sprints', sprintsController);
registerStandardCrud('/progress', progressController);
registerStandardCrud('/reminders', remindersController);
registerStandardCrud('/groups', groupsController);
registerStandardCrud('/group-challenges', groupChallengesController);

apiRouter.get('/group-memberships', asyncHandler(groupMembershipsController.getAll));
apiRouter.post('/group-memberships', asyncHandler(groupMembershipsController.create));
apiRouter.delete('/group-memberships/:id', asyncHandler(groupMembershipsController.remove));

apiRouter.patch('/tasks/:id/status', asyncHandler(patchTaskStatus));
apiRouter.patch('/sprints/:id/finish', asyncHandler(finishSprint));
apiRouter.post('/sync', asyncHandler(syncData));
