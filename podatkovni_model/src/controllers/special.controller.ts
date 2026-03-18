import { Request, Response } from 'express';
import { domainServices } from '../services/domain-services';
import { sendSuccess } from '../utils/response';

export const patchTaskStatus = (req: Request, res: Response): void => {
  const updated = domainServices.updateTaskStatus(req.params.id, req.body);
  sendSuccess(res, 200, 'Task status updated successfully.', updated);
};

export const finishSprint = (req: Request, res: Response): void => {
  const updated = domainServices.finishSprint(req.params.id, req.body ?? {});
  sendSuccess(res, 200, 'Sprint finished successfully.', updated);
};

export const syncData = (req: Request, res: Response): void => {
  const result = domainServices.sync(req.body);
  sendSuccess(res, 200, 'Sync completed successfully.', result);
};
