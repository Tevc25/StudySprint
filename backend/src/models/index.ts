export interface User {
  id?: string;
  name: string;
  email: string;
  role: 'user' | 'moderator';
  password?: string;
}

export interface Goal {
  id?: string;
  title: string;
  description: string;
  deadline: string;
  userId: string;
  status: 'active' | 'completed' | 'paused';
}

export interface Task {
  id?: string;
  title: string;
  description: string;
  deadline: string;
  completed: boolean;
  goalId: string;
  userId: string;
}

export interface Group {
  id?: string;
  name: string;
  description: string;
  moderatorId: string;
  members: string[];
}

export interface Challenge {
  id?: string;
  title: string;
  description: string;
  groupId: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  participants: string[];
}

export interface Notification {
  id?: string;
  title: string;
  message: string;
  userId: string;
  type: 'reminder' | 'system' | 'group';
  createdAt: string;
}
