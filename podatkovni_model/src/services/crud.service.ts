import { ValidationSchema } from '../models/schemas';
import { BaseRepository } from '../repositories/base.repository';
import { EntityCollections } from '../types';
import { HttpError } from '../utils/http-error';
import { validateAgainstSchema } from '../utils/validation';

interface ServiceHooks<K extends keyof EntityCollections, CreateInput, UpdateInput> {
  mapCreate: (payload: CreateInput) => EntityCollections[K];
  mapUpdate: (
    payload: UpdateInput,
    existingEntity: EntityCollections[K]
  ) => EntityCollections[K];
  validateCreateSchema: ValidationSchema;
  validateUpdateSchema: ValidationSchema;
  beforeCreate?: (payload: CreateInput) => void;
  beforeUpdate?: (payload: UpdateInput, existingEntity: EntityCollections[K]) => void;
  beforeDelete?: (existingEntity: EntityCollections[K]) => void;
}

export class CrudService<
  K extends keyof EntityCollections,
  CreateInput extends object,
  UpdateInput extends object
> {
  constructor(
    private readonly entityName: string,
    private readonly repository: BaseRepository<K>,
    private readonly hooks: ServiceHooks<K, CreateInput, UpdateInput>
  ) {}

  public getAll(): EntityCollections[K][] {
    return this.repository.findAll();
  }

  public getById(id: string): EntityCollections[K] {
    const entity = this.repository.findById(id);

    if (!entity) {
      throw new HttpError(404, `${this.entityName} with id '${id}' not found.`);
    }

    return entity;
  }

  public create(payload: unknown): EntityCollections[K] {
    const errors = validateAgainstSchema(payload, this.hooks.validateCreateSchema);
    if (errors.length > 0) {
      throw new HttpError(400, `Invalid ${this.entityName} payload.`, errors);
    }

    const typedPayload = payload as CreateInput;
    this.hooks.beforeCreate?.(typedPayload);

    const entity = this.hooks.mapCreate(typedPayload);
    return this.repository.create(entity);
  }

  public update(id: string, payload: unknown): EntityCollections[K] {
    const errors = validateAgainstSchema(payload, this.hooks.validateUpdateSchema);
    if (errors.length > 0) {
      throw new HttpError(400, `Invalid ${this.entityName} payload.`, errors);
    }

    const existingEntity = this.getById(id);
    const typedPayload = payload as UpdateInput;

    this.hooks.beforeUpdate?.(typedPayload, existingEntity);

    const updatedEntity = this.hooks.mapUpdate(typedPayload, existingEntity);
    const persisted = this.repository.update(id, updatedEntity);

    if (!persisted) {
      throw new HttpError(404, `${this.entityName} with id '${id}' not found.`);
    }

    return persisted;
  }

  public delete(id: string): void {
    const existingEntity = this.getById(id);
    this.hooks.beforeDelete?.(existingEntity);

    const removed = this.repository.delete(id);
    if (!removed) {
      throw new HttpError(404, `${this.entityName} with id '${id}' not found.`);
    }
  }
}
