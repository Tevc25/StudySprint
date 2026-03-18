const idPathParam = {
  name: 'id',
  in: 'path',
  required: true,
  schema: { type: 'string' }
};

const jsonBody = (schemaName: string) => ({
  required: true,
  content: {
    'application/json': {
      schema: { $ref: `#/components/schemas/${schemaName}` }
    }
  }
});

const successResponse = {
  description: 'OK',
  content: {
    'application/json': {
      schema: { $ref: '#/components/schemas/ApiSuccess' }
    }
  }
};

const createdResponse = {
  description: 'Created',
  content: {
    'application/json': {
      schema: { $ref: '#/components/schemas/ApiSuccess' }
    }
  }
};

const errorResponses = {
  400: {
    description: 'Bad Request',
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/ApiError' }
      }
    }
  },
  404: {
    description: 'Not Found',
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/ApiError' }
      }
    }
  },
  409: {
    description: 'Conflict',
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/ApiError' }
      }
    }
  },
  500: {
    description: 'Internal Server Error',
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/ApiError' }
      }
    }
  }
};

const buildCrudPaths = (
  basePath: string,
  tag: string,
  inputSchemaName: string
): Record<string, Record<string, unknown>> => ({
  [`/api/${basePath}`]: {
    get: {
      tags: [tag],
      summary: `List ${tag.toLowerCase()}`,
      responses: {
        200: successResponse,
        ...errorResponses
      }
    },
    post: {
      tags: [tag],
      summary: `Create ${tag.toLowerCase().slice(0, -1)}`,
      requestBody: jsonBody(inputSchemaName),
      responses: {
        201: createdResponse,
        ...errorResponses
      }
    }
  },
  [`/api/${basePath}/{id}`]: {
    get: {
      tags: [tag],
      summary: `Get ${tag.toLowerCase().slice(0, -1)} by id`,
      parameters: [idPathParam],
      responses: {
        200: successResponse,
        ...errorResponses
      }
    },
    put: {
      tags: [tag],
      summary: `Update ${tag.toLowerCase().slice(0, -1)}`,
      parameters: [idPathParam],
      requestBody: jsonBody(inputSchemaName),
      responses: {
        200: successResponse,
        ...errorResponses
      }
    },
    delete: {
      tags: [tag],
      summary: `Delete ${tag.toLowerCase().slice(0, -1)}`,
      parameters: [idPathParam],
      responses: {
        204: { description: 'No Content' },
        ...errorResponses
      }
    }
  }
});

export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'StudySprint API (član 2)',
    version: '1.0.0',
    description:
      'REST API za podatkovni model, sinhronizacijo in skupinsko sodelovanje v aplikaciji StudySprint.'
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Lokalni razvojni strežnik'
    }
  ],
  tags: [
    { name: 'Subjects' },
    { name: 'Goals' },
    { name: 'Tasks' },
    { name: 'Sprints' },
    { name: 'Progress' },
    { name: 'Reminders' },
    { name: 'Groups' },
    { name: 'Group Memberships' },
    { name: 'Group Challenges' },
    { name: 'Sync' }
  ],
  paths: {
    ...buildCrudPaths('subjects', 'Subjects', 'SubjectInput'),
    ...buildCrudPaths('goals', 'Goals', 'GoalInput'),
    ...buildCrudPaths('tasks', 'Tasks', 'TaskInput'),
    ...buildCrudPaths('sprints', 'Sprints', 'StudySprintInput'),
    ...buildCrudPaths('progress', 'Progress', 'ProgressInput'),
    ...buildCrudPaths('reminders', 'Reminders', 'ReminderInput'),
    ...buildCrudPaths('groups', 'Groups', 'GroupInput'),
    ...buildCrudPaths('group-challenges', 'Group Challenges', 'GroupChallengeInput'),

    '/api/group-memberships': {
      get: {
        tags: ['Group Memberships'],
        summary: 'List group memberships',
        responses: {
          200: successResponse,
          ...errorResponses
        }
      },
      post: {
        tags: ['Group Memberships'],
        summary: 'Create group membership',
        requestBody: jsonBody('GroupMembershipInput'),
        responses: {
          201: createdResponse,
          ...errorResponses
        }
      }
    },

    '/api/group-memberships/{id}': {
      delete: {
        tags: ['Group Memberships'],
        summary: 'Delete group membership',
        parameters: [idPathParam],
        responses: {
          204: { description: 'No Content' },
          ...errorResponses
        }
      }
    },

    '/api/tasks/{id}/status': {
      patch: {
        tags: ['Tasks'],
        summary: 'Patch task status',
        parameters: [idPathParam],
        requestBody: jsonBody('TaskStatusPatchInput'),
        responses: {
          200: successResponse,
          ...errorResponses
        }
      }
    },

    '/api/sprints/{id}/finish': {
      patch: {
        tags: ['Sprints'],
        summary: 'Finish sprint',
        parameters: [idPathParam],
        requestBody: {
          required: false,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SprintFinishInput' }
            }
          }
        },
        responses: {
          200: successResponse,
          ...errorResponses
        }
      }
    },

    '/api/sync': {
      post: {
        tags: ['Sync'],
        summary: 'Sync local changes with server',
        requestBody: jsonBody('SyncInput'),
        responses: {
          200: successResponse,
          ...errorResponses
        }
      }
    }
  },
  components: {
    schemas: {
      ApiSuccess: {
        type: 'object',
        required: ['success', 'message', 'data'],
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Operation successful.' },
          data: { type: 'object', additionalProperties: true }
        }
      },
      ApiError: {
        type: 'object',
        required: ['success', 'message'],
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'Validation failed.' },
          errors: {
            type: 'array',
            items: { type: 'string' }
          }
        }
      },

      SubjectInput: {
        type: 'object',
        required: ['name', 'description', 'color', 'userId'],
        properties: {
          name: { type: 'string' },
          description: { type: 'string' },
          color: { type: 'string', example: '#2D8CFF' },
          userId: { type: 'string' }
        }
      },

      GoalInput: {
        type: 'object',
        required: ['title', 'description', 'deadline', 'priority', 'status', 'userId', 'subjectId'],
        properties: {
          title: { type: 'string' },
          description: { type: 'string' },
          deadline: { type: 'string', format: 'date-time' },
          priority: { type: 'string', enum: ['low', 'medium', 'high'] },
          status: {
            type: 'string',
            enum: ['planned', 'in_progress', 'completed', 'cancelled']
          },
          userId: { type: 'string' },
          subjectId: { type: 'string' }
        }
      },

      TaskInput: {
        type: 'object',
        required: ['title', 'description', 'deadline', 'status', 'estimatedMinutes', 'order', 'goalId'],
        properties: {
          title: { type: 'string' },
          description: { type: 'string' },
          deadline: { type: 'string', format: 'date-time' },
          status: { type: 'string', enum: ['todo', 'in_progress', 'done'] },
          estimatedMinutes: { type: 'number' },
          order: { type: 'number' },
          goalId: { type: 'string' }
        }
      },

      StudySprintInput: {
        type: 'object',
        required: ['startTime', 'endTime', 'durationMinutes', 'status', 'notes', 'userId', 'taskId'],
        properties: {
          startTime: { type: 'string', format: 'date-time' },
          endTime: { type: 'string', format: 'date-time' },
          durationMinutes: { type: 'number' },
          status: { type: 'string', enum: ['planned', 'active', 'finished', 'cancelled'] },
          notes: { type: 'string' },
          userId: { type: 'string' },
          taskId: { type: 'string' }
        }
      },

      ProgressInput: {
        type: 'object',
        required: [
          'date',
          'completedTasks',
          'sprintCount',
          'totalStudyMinutes',
          'completionPercentage',
          'userId'
        ],
        properties: {
          date: { type: 'string', example: '2026-03-18' },
          completedTasks: { type: 'number' },
          sprintCount: { type: 'number' },
          totalStudyMinutes: { type: 'number' },
          completionPercentage: { type: 'number' },
          userId: { type: 'string' }
        }
      },

      ReminderInput: {
        type: 'object',
        required: ['type', 'scheduledFor', 'status', 'channel', 'userId'],
        properties: {
          type: { type: 'string', enum: ['goal', 'task', 'general'] },
          scheduledFor: { type: 'string', format: 'date-time' },
          status: { type: 'string', enum: ['pending', 'sent', 'cancelled'] },
          channel: { type: 'string', enum: ['push', 'email', 'in_app'] },
          userId: { type: 'string' },
          goalId: { type: 'string' },
          taskId: { type: 'string' }
        }
      },

      GroupInput: {
        type: 'object',
        required: ['name', 'description', 'createdByUserId'],
        properties: {
          name: { type: 'string' },
          description: { type: 'string' },
          createdByUserId: { type: 'string' }
        }
      },

      GroupMembershipInput: {
        type: 'object',
        required: ['userId', 'groupId', 'role'],
        properties: {
          userId: { type: 'string' },
          groupId: { type: 'string' },
          role: { type: 'string', enum: ['owner', 'member', 'moderator'] }
        }
      },

      GroupChallengeInput: {
        type: 'object',
        required: ['title', 'description', 'startDate', 'endDate', 'targetValue', 'status', 'groupId'],
        properties: {
          title: { type: 'string' },
          description: { type: 'string' },
          startDate: { type: 'string', example: '2026-03-20' },
          endDate: { type: 'string', example: '2026-03-25' },
          targetValue: { type: 'number' },
          status: {
            type: 'string',
            enum: ['planned', 'active', 'completed', 'cancelled']
          },
          groupId: { type: 'string' }
        }
      },

      TaskStatusPatchInput: {
        type: 'object',
        required: ['status'],
        properties: {
          status: { type: 'string', enum: ['todo', 'in_progress', 'done'] }
        }
      },

      SprintFinishInput: {
        type: 'object',
        properties: {
          notes: { type: 'string' },
          endTime: { type: 'string', format: 'date-time' }
        }
      },

      LocalChange: {
        type: 'object',
        required: ['entity', 'operation', 'timestamp'],
        properties: {
          entity: {
            type: 'string',
            enum: [
              'subjects',
              'goals',
              'tasks',
              'sprints',
              'progress',
              'reminders',
              'groups',
              'groupMemberships',
              'groupChallenges'
            ]
          },
          operation: { type: 'string', enum: ['create', 'update', 'delete'] },
          id: { type: 'string' },
          payload: {
            type: 'object',
            additionalProperties: true
          },
          timestamp: { type: 'string', format: 'date-time' }
        }
      },

      SyncInput: {
        type: 'object',
        required: ['deviceId', 'userId', 'lastSyncAt'],
        properties: {
          deviceId: { type: 'string' },
          userId: { type: 'string' },
          lastSyncAt: { type: 'string', format: 'date-time' },
          localChanges: {
            type: 'array',
            items: { $ref: '#/components/schemas/LocalChange' }
          }
        }
      }
    }
  }
};
