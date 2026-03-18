import {
  EntityCollections,
  Goal,
  Group,
  GroupChallenge,
  GroupMembership,
  Progress,
  Reminder,
  StudySprint,
  Subject,
  Task,
  User
} from '../types';

const users: User[] = [
  {
    id: 'user-1',
    firstName: 'Ana',
    lastName: 'Novak',
    email: 'ana.novak@studysprint.app',
    passwordHash: 'hash_ana_123',
    role: 'student',
    createdAt: '2026-03-01T08:00:00.000Z',
    lastSyncAt: '2026-03-17T18:30:00.000Z'
  },
  {
    id: 'user-2',
    firstName: 'Luka',
    lastName: 'Kranjc',
    email: 'luka.kranjc@studysprint.app',
    passwordHash: 'hash_luka_123',
    role: 'student',
    createdAt: '2026-03-02T09:10:00.000Z',
    lastSyncAt: '2026-03-17T19:10:00.000Z'
  }
];

const subjects: Subject[] = [
  {
    id: 'subj-1',
    name: 'Sistemske tehnologije',
    description: 'Priprava na seminarsko nalogo in izpit.',
    color: '#2D8CFF',
    userId: 'user-1'
  },
  {
    id: 'subj-2',
    name: 'Algoritmi',
    description: 'Vaje in domače naloge.',
    color: '#10B981',
    userId: 'user-2'
  }
];

const goals: Goal[] = [
  {
    id: 'goal-1',
    title: 'Zaključiti idejno zasnovo PWA',
    description: 'Pripraviti končno verzijo opisa podatkovnega modela.',
    deadline: '2026-03-25T20:00:00.000Z',
    priority: 'high',
    status: 'in_progress',
    createdAt: '2026-03-10T10:00:00.000Z',
    userId: 'user-1',
    subjectId: 'subj-1'
  }
];

const tasks: Task[] = [
  {
    id: 'task-1',
    title: 'Opis entitet in atributov',
    description: 'Napisati tabelo entitet za dokumentacijo.',
    deadline: '2026-03-20T18:00:00.000Z',
    status: 'in_progress',
    estimatedMinutes: 90,
    order: 1,
    goalId: 'goal-1'
  }
];

const sprints: StudySprint[] = [
  {
    id: 'sprint-1',
    startTime: '2026-03-18T09:00:00.000Z',
    endTime: '2026-03-18T09:25:00.000Z',
    durationMinutes: 25,
    status: 'finished',
    notes: 'Dober fokus, brez prekinitev.',
    userId: 'user-1',
    taskId: 'task-1'
  }
];

const progress: Progress[] = [
  {
    id: 'progress-1',
    date: '2026-03-18',
    completedTasks: 1,
    sprintCount: 2,
    totalStudyMinutes: 50,
    completionPercentage: 60,
    userId: 'user-1'
  }
];

const reminders: Reminder[] = [
  {
    id: 'reminder-1',
    type: 'task',
    scheduledFor: '2026-03-19T07:00:00.000Z',
    status: 'pending',
    channel: 'push',
    userId: 'user-1',
    taskId: 'task-1'
  }
];

const groups: Group[] = [
  {
    id: 'group-1',
    name: 'Sprint Mojstri',
    description: 'Skupina za dnevno motivacijo in poročanje.',
    createdAt: '2026-03-05T11:00:00.000Z',
    createdByUserId: 'user-1'
  }
];

const groupMemberships: GroupMembership[] = [
  {
    id: 'membership-1',
    userId: 'user-1',
    groupId: 'group-1',
    role: 'owner',
    joinedAt: '2026-03-05T11:05:00.000Z'
  },
  {
    id: 'membership-2',
    userId: 'user-2',
    groupId: 'group-1',
    role: 'member',
    joinedAt: '2026-03-06T12:00:00.000Z'
  }
];

const groupChallenges: GroupChallenge[] = [
  {
    id: 'challenge-1',
    title: '5 sprintov v 3 dneh',
    description: 'Vsak član naj opravi vsaj 5 sprintov do roka.',
    startDate: '2026-03-18',
    endDate: '2026-03-21',
    targetValue: 5,
    status: 'active',
    groupId: 'group-1'
  }
];

export const seedData: { [K in keyof EntityCollections]: EntityCollections[K][] } = {
  users,
  subjects,
  goals,
  tasks,
  sprints,
  progress,
  reminders,
  groups,
  groupMemberships,
  groupChallenges
};
