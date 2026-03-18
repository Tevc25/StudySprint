import {
  goalSchema,
  groupChallengeSchema,
  groupMembershipSchema,
  groupSchema,
  progressSchema,
  reminderSchema,
  sprintFinishPatchSchema,
  sprintSchema,
  subjectSchema,
  syncSchema,
  taskSchema,
  taskStatusPatchSchema
} from '../models/schemas';
import { BaseRepository } from '../repositories/base.repository';
import { CrudService } from './crud.service';
import {
  EntityCollections,
  LocalChange,
  NewGoal,
  NewGroup,
  NewGroupChallenge,
  NewGroupMembership,
  NewProgress,
  NewReminder,
  NewStudySprint,
  NewSubject,
  NewTask,
  SyncResponseData,
  TaskStatus,
  UpdateGoal,
  UpdateGroup,
  UpdateGroupChallenge,
  UpdateProgress,
  UpdateReminder,
  UpdateStudySprint,
  UpdateSubject,
  UpdateTask,
  User
} from '../types';
import { HttpError } from '../utils/http-error';
import { generateId } from '../utils/id';
import { validateAgainstSchema } from '../utils/validation';

const userRepository = new BaseRepository('users');
const subjectRepository = new BaseRepository('subjects');
const goalRepository = new BaseRepository('goals');
const taskRepository = new BaseRepository('tasks');
const sprintRepository = new BaseRepository('sprints');
const progressRepository = new BaseRepository('progress');
const reminderRepository = new BaseRepository('reminders');
const groupRepository = new BaseRepository('groups');
const groupMembershipRepository = new BaseRepository('groupMemberships');
const groupChallengeRepository = new BaseRepository('groupChallenges');

const ensureUserExists = (userId: string): void => {
  if (!userRepository.exists(userId)) {
    throw new HttpError(404, `User with id '${userId}' not found.`);
  }
};

const ensureSubjectExists = (subjectId: string): void => {
  if (!subjectRepository.exists(subjectId)) {
    throw new HttpError(404, `Subject with id '${subjectId}' not found.`);
  }
};

const ensureGoalExists = (goalId: string): void => {
  if (!goalRepository.exists(goalId)) {
    throw new HttpError(404, `Goal with id '${goalId}' not found.`);
  }
};

const ensureTaskExists = (taskId: string): void => {
  if (!taskRepository.exists(taskId)) {
    throw new HttpError(404, `Task with id '${taskId}' not found.`);
  }
};

const ensureGroupExists = (groupId: string): void => {
  if (!groupRepository.exists(groupId)) {
    throw new HttpError(404, `Group with id '${groupId}' not found.`);
  }
};

const ensureSubjectBelongsToUser = (subjectId: string, userId: string): void => {
  const subject = subjectRepository.findById(subjectId);
  if (!subject) {
    throw new HttpError(404, `Subject with id '${subjectId}' not found.`);
  }

  if (subject.userId !== userId) {
    throw new HttpError(409, 'Goal userId must match subject owner userId.');
  }
};

const blockDeleteIfDependentsExist = (
  dependentCount: number,
  message: string
): void => {
  if (dependentCount > 0) {
    throw new HttpError(409, message);
  }
};

class DomainServices {
  public readonly subjectService = new CrudService<'subjects', NewSubject, UpdateSubject>(
    'Subject',
    subjectRepository,
    {
      validateCreateSchema: subjectSchema,
      validateUpdateSchema: subjectSchema,
      beforeCreate: (payload) => {
        ensureUserExists(payload.userId);

        const duplicate = subjectRepository.findOne(
          (subject) =>
            subject.userId === payload.userId &&
            subject.name.toLowerCase() === payload.name.toLowerCase()
        );

        if (duplicate) {
          throw new HttpError(409, 'Subject with the same name already exists for this user.');
        }
      },
      beforeUpdate: (payload, existing) => {
        ensureUserExists(payload.userId);

        const duplicate = subjectRepository.findOne(
          (subject) =>
            subject.id !== existing.id &&
            subject.userId === payload.userId &&
            subject.name.toLowerCase() === payload.name.toLowerCase()
        );

        if (duplicate) {
          throw new HttpError(409, 'Subject with the same name already exists for this user.');
        }
      },
      beforeDelete: (existing) => {
        const dependentGoals = goalRepository.findAll().filter((goal) => goal.subjectId === existing.id)
          .length;
        blockDeleteIfDependentsExist(
          dependentGoals,
          'Cannot delete subject with existing goals. Remove goals first.'
        );
      },
      mapCreate: (payload) => ({
        id: generateId('subj'),
        ...payload
      }),
      mapUpdate: (payload, existing) => ({
        ...existing,
        ...payload
      })
    }
  );

  public readonly goalService = new CrudService<'goals', NewGoal, UpdateGoal>('Goal', goalRepository, {
    validateCreateSchema: goalSchema,
    validateUpdateSchema: goalSchema,
    beforeCreate: (payload) => {
      ensureUserExists(payload.userId);
      ensureSubjectExists(payload.subjectId);
      ensureSubjectBelongsToUser(payload.subjectId, payload.userId);
    },
    beforeUpdate: (payload) => {
      ensureUserExists(payload.userId);
      ensureSubjectExists(payload.subjectId);
      ensureSubjectBelongsToUser(payload.subjectId, payload.userId);
    },
    beforeDelete: (existing) => {
      const dependentTasks = taskRepository.findAll().filter((task) => task.goalId === existing.id).length;
      blockDeleteIfDependentsExist(
        dependentTasks,
        'Cannot delete goal with existing tasks. Remove tasks first.'
      );
    },
    mapCreate: (payload) => ({
      id: generateId('goal'),
      createdAt: new Date().toISOString(),
      ...payload
    }),
    mapUpdate: (payload, existing) => ({
      ...existing,
      ...payload,
      createdAt: existing.createdAt
    })
  });

  public readonly taskService = new CrudService<'tasks', NewTask, UpdateTask>('Task', taskRepository, {
    validateCreateSchema: taskSchema,
    validateUpdateSchema: taskSchema,
    beforeCreate: (payload) => {
      ensureGoalExists(payload.goalId);
    },
    beforeUpdate: (payload) => {
      ensureGoalExists(payload.goalId);
    },
    beforeDelete: (existing) => {
      const dependentSprints = sprintRepository.findAll().filter((sprint) => sprint.taskId === existing.id)
        .length;
      const dependentReminders = reminderRepository
        .findAll()
        .filter((reminder) => reminder.taskId === existing.id).length;

      blockDeleteIfDependentsExist(
        dependentSprints + dependentReminders,
        'Cannot delete task with related sprints or reminders. Remove dependent records first.'
      );
    },
    mapCreate: (payload) => ({
      id: generateId('task'),
      ...payload
    }),
    mapUpdate: (payload, existing) => ({
      ...existing,
      ...payload
    })
  });

  public readonly sprintService = new CrudService<'sprints', NewStudySprint, UpdateStudySprint>(
    'StudySprint',
    sprintRepository,
    {
      validateCreateSchema: sprintSchema,
      validateUpdateSchema: sprintSchema,
      beforeCreate: (payload) => {
        ensureUserExists(payload.userId);
        ensureTaskExists(payload.taskId);
      },
      beforeUpdate: (payload) => {
        ensureUserExists(payload.userId);
        ensureTaskExists(payload.taskId);
      },
      mapCreate: (payload) => ({
        id: generateId('sprint'),
        ...payload
      }),
      mapUpdate: (payload, existing) => ({
        ...existing,
        ...payload
      })
    }
  );

  public readonly progressService = new CrudService<'progress', NewProgress, UpdateProgress>(
    'Progress',
    progressRepository,
    {
      validateCreateSchema: progressSchema,
      validateUpdateSchema: progressSchema,
      beforeCreate: (payload) => {
        ensureUserExists(payload.userId);
      },
      beforeUpdate: (payload) => {
        ensureUserExists(payload.userId);
      },
      mapCreate: (payload) => ({
        id: generateId('progress'),
        ...payload
      }),
      mapUpdate: (payload, existing) => ({
        ...existing,
        ...payload
      })
    }
  );

  public readonly reminderService = new CrudService<'reminders', NewReminder, UpdateReminder>(
    'Reminder',
    reminderRepository,
    {
      validateCreateSchema: reminderSchema,
      validateUpdateSchema: reminderSchema,
      beforeCreate: (payload) => {
        ensureUserExists(payload.userId);

        if (payload.goalId) {
          ensureGoalExists(payload.goalId);
        }

        if (payload.taskId) {
          ensureTaskExists(payload.taskId);
        }
      },
      beforeUpdate: (payload) => {
        ensureUserExists(payload.userId);

        if (payload.goalId) {
          ensureGoalExists(payload.goalId);
        }

        if (payload.taskId) {
          ensureTaskExists(payload.taskId);
        }
      },
      mapCreate: (payload) => ({
        id: generateId('reminder'),
        ...payload
      }),
      mapUpdate: (payload, existing) => ({
        ...existing,
        ...payload
      })
    }
  );

  public readonly groupService = new CrudService<'groups', NewGroup, UpdateGroup>('Group', groupRepository, {
    validateCreateSchema: groupSchema,
    validateUpdateSchema: groupSchema,
    beforeCreate: (payload) => {
      ensureUserExists(payload.createdByUserId);
    },
    beforeUpdate: (payload) => {
      ensureUserExists(payload.createdByUserId);
    },
    beforeDelete: (existing) => {
      const dependentMemberships = groupMembershipRepository
        .findAll()
        .filter((membership) => membership.groupId === existing.id).length;
      const dependentChallenges = groupChallengeRepository
        .findAll()
        .filter((challenge) => challenge.groupId === existing.id).length;

      blockDeleteIfDependentsExist(
        dependentMemberships + dependentChallenges,
        'Cannot delete group with memberships or challenges. Remove dependent records first.'
      );
    },
    mapCreate: (payload) => ({
      id: generateId('group'),
      createdAt: new Date().toISOString(),
      ...payload
    }),
    mapUpdate: (payload, existing) => ({
      ...existing,
      ...payload,
      createdAt: existing.createdAt
    })
  });

  public readonly groupMembershipService = new CrudService<
    'groupMemberships',
    NewGroupMembership,
    NewGroupMembership
  >('GroupMembership', groupMembershipRepository, {
    validateCreateSchema: groupMembershipSchema,
    validateUpdateSchema: groupMembershipSchema,
    beforeCreate: (payload) => {
      ensureUserExists(payload.userId);
      ensureGroupExists(payload.groupId);

      const duplicate = groupMembershipRepository.findOne(
        (membership) =>
          membership.userId === payload.userId && membership.groupId === payload.groupId
      );

      if (duplicate) {
        throw new HttpError(409, 'Group membership already exists for this user and group.');
      }
    },
    beforeUpdate: () => {
      throw new HttpError(405, 'PUT is not supported for group memberships.');
    },
    mapCreate: (payload) => ({
      id: generateId('membership'),
      joinedAt: new Date().toISOString(),
      ...payload
    }),
    mapUpdate: (payload, existing) => ({
      ...existing,
      ...payload,
      joinedAt: existing.joinedAt
    })
  });

  public readonly groupChallengeService = new CrudService<
    'groupChallenges',
    NewGroupChallenge,
    UpdateGroupChallenge
  >('GroupChallenge', groupChallengeRepository, {
    validateCreateSchema: groupChallengeSchema,
    validateUpdateSchema: groupChallengeSchema,
    beforeCreate: (payload) => {
      ensureGroupExists(payload.groupId);
    },
    beforeUpdate: (payload) => {
      ensureGroupExists(payload.groupId);
    },
    mapCreate: (payload) => ({
      id: generateId('challenge'),
      ...payload
    }),
    mapUpdate: (payload, existing) => ({
      ...existing,
      ...payload
    })
  });

  public updateTaskStatus(taskId: string, payload: unknown): EntityCollections['tasks'] {
    const errors = validateAgainstSchema(payload, taskStatusPatchSchema);
    if (errors.length > 0) {
      throw new HttpError(400, 'Invalid task status payload.', errors);
    }

    const task = this.taskService.getById(taskId);
    const statusPayload = payload as { status: TaskStatus };

    const updatedTask = {
      ...task,
      status: statusPayload.status
    };

    const persisted = taskRepository.update(taskId, updatedTask);
    if (!persisted) {
      throw new HttpError(404, `Task with id '${taskId}' not found.`);
    }

    return persisted;
  }

  public finishSprint(sprintId: string, payload: unknown): EntityCollections['sprints'] {
    const errors = validateAgainstSchema(payload, sprintFinishPatchSchema);
    if (errors.length > 0) {
      throw new HttpError(400, 'Invalid sprint finish payload.', errors);
    }

    const sprint = this.sprintService.getById(sprintId);
    if (sprint.status === 'finished') {
      throw new HttpError(409, 'Sprint is already finished.');
    }

    const finishPayload = payload as { notes?: string; endTime?: string };
    const updatedSprint = {
      ...sprint,
      status: 'finished' as const,
      endTime: finishPayload.endTime ?? new Date().toISOString(),
      notes: finishPayload.notes ?? sprint.notes
    };

    const persisted = sprintRepository.update(sprintId, updatedSprint);
    if (!persisted) {
      throw new HttpError(404, `StudySprint with id '${sprintId}' not found.`);
    }

    return persisted;
  }

  public sync(payload: unknown): SyncResponseData {
    const baseErrors = validateAgainstSchema(payload, syncSchema, true);
    if (baseErrors.length > 0) {
      throw new HttpError(400, 'Invalid sync payload.', baseErrors);
    }

    const syncPayload = payload as {
      deviceId: string;
      userId: string;
      lastSyncAt: string;
      localChanges?: LocalChange[];
    };

    ensureUserExists(syncPayload.userId);

    if (syncPayload.localChanges && !Array.isArray(syncPayload.localChanges)) {
      throw new HttpError(400, 'localChanges must be an array.');
    }

    const allowedEntities = new Set<keyof EntityCollections>([
      'subjects',
      'goals',
      'tasks',
      'sprints',
      'progress',
      'reminders',
      'groups',
      'groupMemberships',
      'groupChallenges'
    ]);

    let acceptedChanges = 0;
    let rejectedChanges = 0;
    const conflicts: SyncResponseData['conflicts'] = [];

    for (const change of syncPayload.localChanges ?? []) {
      const validOperation = change.operation === 'create' || change.operation === 'update' || change.operation === 'delete';
      const validEntity = allowedEntities.has(change.entity);

      if (!validEntity || !validOperation) {
        rejectedChanges += 1;
        conflicts.push({
          entity: String(change.entity),
          reason: 'Unsupported entity or operation in sync payload.',
          localChange: change
        });
        continue;
      }

      acceptedChanges += 1;
    }

    const user = userRepository.findById(syncPayload.userId) as User;
    userRepository.update(syncPayload.userId, {
      ...user,
      lastSyncAt: new Date().toISOString()
    });

    return {
      acceptedChanges,
      rejectedChanges,
      conflicts,
      serverTime: new Date().toISOString(),
      nextSyncToken: generateId('sync')
    };
  }
}

export const domainServices = new DomainServices();
