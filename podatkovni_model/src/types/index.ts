export type UserRole = 'student' | 'mentor' | 'admin';

export type GoalPriority = 'low' | 'medium' | 'high';
export type GoalStatus = 'planned' | 'in_progress' | 'completed' | 'cancelled';

export type TaskStatus = 'todo' | 'in_progress' | 'done';

export type SprintStatus = 'planned' | 'active' | 'finished' | 'cancelled';

export type ReminderType = 'goal' | 'task' | 'general';
export type ReminderStatus = 'pending' | 'sent' | 'cancelled';
export type ReminderChannel = 'push' | 'email' | 'in_app';

export type GroupMembershipRole = 'owner' | 'member' | 'moderator';
export type GroupChallengeStatus = 'planned' | 'active' | 'completed' | 'cancelled';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  createdAt: string;
  lastSyncAt: string;
}

export interface Subject {
  id: string;
  name: string;
  description: string;
  color: string;
  userId: string;
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  deadline: string;
  priority: GoalPriority;
  status: GoalStatus;
  createdAt: string;
  userId: string;
  subjectId: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  deadline: string;
  status: TaskStatus;
  estimatedMinutes: number;
  order: number;
  goalId: string;
}

export interface StudySprint {
  id: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  status: SprintStatus;
  notes: string;
  userId: string;
  taskId: string;
}

export interface Progress {
  id: string;
  date: string;
  completedTasks: number;
  sprintCount: number;
  totalStudyMinutes: number;
  completionPercentage: number;
  userId: string;
}

export interface Reminder {
  id: string;
  type: ReminderType;
  scheduledFor: string;
  status: ReminderStatus;
  channel: ReminderChannel;
  userId: string;
  goalId?: string;
  taskId?: string;
}

export interface Group {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  createdByUserId: string;
}

export interface GroupMembership {
  id: string;
  userId: string;
  groupId: string;
  role: GroupMembershipRole;
  joinedAt: string;
}

export interface GroupChallenge {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  targetValue: number;
  status: GroupChallengeStatus;
  groupId: string;
}

export interface EntityCollections {
  users: User;
  subjects: Subject;
  goals: Goal;
  tasks: Task;
  sprints: StudySprint;
  progress: Progress;
  reminders: Reminder;
  groups: Group;
  groupMemberships: GroupMembership;
  groupChallenges: GroupChallenge;
}

export type NewSubject = Omit<Subject, 'id'>;
export type NewGoal = Omit<Goal, 'id' | 'createdAt'>;
export type NewTask = Omit<Task, 'id'>;
export type NewStudySprint = Omit<StudySprint, 'id'>;
export type NewProgress = Omit<Progress, 'id'>;
export type NewReminder = Omit<Reminder, 'id'>;
export type NewGroup = Omit<Group, 'id' | 'createdAt'>;
export type NewGroupMembership = Omit<GroupMembership, 'id' | 'joinedAt'>;
export type NewGroupChallenge = Omit<GroupChallenge, 'id'>;

export type UpdateSubject = NewSubject;
export type UpdateGoal = NewGoal;
export type UpdateTask = NewTask;
export type UpdateStudySprint = NewStudySprint;
export type UpdateProgress = NewProgress;
export type UpdateReminder = NewReminder;
export type UpdateGroup = NewGroup;
export type UpdateGroupChallenge = NewGroupChallenge;

export interface ApiSuccessResponse<T> {
  success: true;
  message: string;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: string[];
}

export type SyncOperation = 'create' | 'update' | 'delete';

export interface LocalChange {
  entity: keyof EntityCollections;
  operation: SyncOperation;
  id?: string;
  payload?: Record<string, unknown>;
  timestamp: string;
}

export interface SyncRequest {
  deviceId: string;
  userId: string;
  lastSyncAt: string;
  localChanges: LocalChange[];
}

export interface SyncConflict {
  entity: string;
  reason: string;
  localChange?: LocalChange;
}

export interface SyncResponseData {
  acceptedChanges: number;
  rejectedChanges: number;
  conflicts: SyncConflict[];
  serverTime: string;
  nextSyncToken: string;
}
