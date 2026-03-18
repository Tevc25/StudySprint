export type FieldType = 'string' | 'number' | 'boolean';

export interface FieldSchema {
  type: FieldType;
  required?: boolean;
  enumValues?: readonly string[];
}

export type ValidationSchema = Record<string, FieldSchema>;

export const goalPriorityValues = ['low', 'medium', 'high'] as const;
export const goalStatusValues = ['planned', 'in_progress', 'completed', 'cancelled'] as const;
export const taskStatusValues = ['todo', 'in_progress', 'done'] as const;
export const sprintStatusValues = ['planned', 'active', 'finished', 'cancelled'] as const;
export const reminderTypeValues = ['goal', 'task', 'general'] as const;
export const reminderStatusValues = ['pending', 'sent', 'cancelled'] as const;
export const reminderChannelValues = ['push', 'email', 'in_app'] as const;
export const groupMembershipRoleValues = ['owner', 'member', 'moderator'] as const;
export const groupChallengeStatusValues = ['planned', 'active', 'completed', 'cancelled'] as const;

export const subjectSchema: ValidationSchema = {
  name: { type: 'string', required: true },
  description: { type: 'string', required: true },
  color: { type: 'string', required: true },
  userId: { type: 'string', required: true }
};

export const goalSchema: ValidationSchema = {
  title: { type: 'string', required: true },
  description: { type: 'string', required: true },
  deadline: { type: 'string', required: true },
  priority: { type: 'string', required: true, enumValues: goalPriorityValues },
  status: { type: 'string', required: true, enumValues: goalStatusValues },
  userId: { type: 'string', required: true },
  subjectId: { type: 'string', required: true }
};

export const taskSchema: ValidationSchema = {
  title: { type: 'string', required: true },
  description: { type: 'string', required: true },
  deadline: { type: 'string', required: true },
  status: { type: 'string', required: true, enumValues: taskStatusValues },
  estimatedMinutes: { type: 'number', required: true },
  order: { type: 'number', required: true },
  goalId: { type: 'string', required: true }
};

export const sprintSchema: ValidationSchema = {
  startTime: { type: 'string', required: true },
  endTime: { type: 'string', required: true },
  durationMinutes: { type: 'number', required: true },
  status: { type: 'string', required: true, enumValues: sprintStatusValues },
  notes: { type: 'string', required: true },
  userId: { type: 'string', required: true },
  taskId: { type: 'string', required: true }
};

export const progressSchema: ValidationSchema = {
  date: { type: 'string', required: true },
  completedTasks: { type: 'number', required: true },
  sprintCount: { type: 'number', required: true },
  totalStudyMinutes: { type: 'number', required: true },
  completionPercentage: { type: 'number', required: true },
  userId: { type: 'string', required: true }
};

export const reminderSchema: ValidationSchema = {
  type: { type: 'string', required: true, enumValues: reminderTypeValues },
  scheduledFor: { type: 'string', required: true },
  status: { type: 'string', required: true, enumValues: reminderStatusValues },
  channel: { type: 'string', required: true, enumValues: reminderChannelValues },
  userId: { type: 'string', required: true },
  goalId: { type: 'string' },
  taskId: { type: 'string' }
};

export const groupSchema: ValidationSchema = {
  name: { type: 'string', required: true },
  description: { type: 'string', required: true },
  createdByUserId: { type: 'string', required: true }
};

export const groupMembershipSchema: ValidationSchema = {
  userId: { type: 'string', required: true },
  groupId: { type: 'string', required: true },
  role: { type: 'string', required: true, enumValues: groupMembershipRoleValues }
};

export const groupChallengeSchema: ValidationSchema = {
  title: { type: 'string', required: true },
  description: { type: 'string', required: true },
  startDate: { type: 'string', required: true },
  endDate: { type: 'string', required: true },
  targetValue: { type: 'number', required: true },
  status: { type: 'string', required: true, enumValues: groupChallengeStatusValues },
  groupId: { type: 'string', required: true }
};

export const taskStatusPatchSchema: ValidationSchema = {
  status: { type: 'string', required: true, enumValues: taskStatusValues }
};

export const sprintFinishPatchSchema: ValidationSchema = {
  notes: { type: 'string' },
  endTime: { type: 'string' }
};

export const syncSchema: ValidationSchema = {
  deviceId: { type: 'string', required: true },
  userId: { type: 'string', required: true },
  lastSyncAt: { type: 'string', required: true }
};
