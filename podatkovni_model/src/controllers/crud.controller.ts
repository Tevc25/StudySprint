import { Request, Response } from 'express';
import { CrudService } from '../services/crud.service';
import { EntityCollections } from '../types';
import { sendSuccess } from '../utils/response';

export class CrudController<
  K extends keyof EntityCollections,
  CreateInput extends object,
  UpdateInput extends object
> {
  constructor(
    private readonly entityLabel: string,
    private readonly service: CrudService<K, CreateInput, UpdateInput>
  ) {}

  public getAll = (_req: Request, res: Response): void => {
    const items = this.service.getAll();
    sendSuccess(res, 200, `${this.entityLabel} list fetched successfully.`, items);
  };

  public getById = (req: Request, res: Response): void => {
    const item = this.service.getById(req.params.id);
    sendSuccess(res, 200, `${this.entityLabel} fetched successfully.`, item);
  };

  public create = (req: Request, res: Response): void => {
    const created = this.service.create(req.body);
    sendSuccess(res, 201, `${this.entityLabel} created successfully.`, created);
  };

  public update = (req: Request, res: Response): void => {
    const updated = this.service.update(req.params.id, req.body);
    sendSuccess(res, 200, `${this.entityLabel} updated successfully.`, updated);
  };

  public remove = (req: Request, res: Response): void => {
    this.service.delete(req.params.id);
    res.status(204).send();
  };
}
