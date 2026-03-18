export type Priority = "low" | "medium" | "high";
export type WorkStatus = "planned" | "in_progress" | "done";
export type ReminderChannel = "push" | "in_app" | "email";
export type GroupRole = "member" | "moderator";

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: "user" | "member" | "moderator";
  createdAt: string;
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  deadline: string;
  priority: Priority;
  status: WorkStatus;
  userId: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  deadline: string;
  status: WorkStatus;
  estimatedMinutes: number;
  goalId: string;
}

export interface StudySprint {
  id: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  status: "active" | "finished";
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
  type: "task" | "goal";
  scheduledFor: string;
  status: "pending" | "sent";
  channel: ReminderChannel;
  userId: string;
  goalId?: string;
  taskId?: string;
}

export interface StudyGroup {
  id: string;
  name: string;
  description: string;
  createdByUserId: string;
  createdAt: string;
}

export interface GroupMembership {
  id: string;
  userId: string;
  groupId: string;
  role: GroupRole;
  joinedAt: string;
}

export interface GroupChallenge {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  targetValue: number;
  status: "planned" | "active" | "finished";
  groupId: string;
}

export interface EntityMap {
  users: User;
  goals: Goal;
  tasks: Task;
  sprints: StudySprint;
  progress: Progress;
  reminders: Reminder;
  groups: StudyGroup;
  memberships: GroupMembership;
  challenges: GroupChallenge;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
}
