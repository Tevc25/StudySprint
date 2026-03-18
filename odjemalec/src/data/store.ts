import { EntityMap, Goal, GroupChallenge, GroupMembership, Progress, Reminder, StudyGroup, StudySprint, Task, User } from "../types";

export type ResourceName = keyof EntityMap;

export const store: { [K in ResourceName]: EntityMap[K][] } = {
  users: [
    {
      id: "u-1",
      firstName: "Ana",
      lastName: "Novak",
      email: "ana.novak@example.com",
      role: "moderator",
      createdAt: new Date().toISOString(),
    },
  ],
  goals: [],
  tasks: [],
  sprints: [],
  progress: [],
  reminders: [],
  groups: [
    {
      id: "g-1",
      name: "Algoritmi sprint",
      description: "Skupina za pripravo na kolokvij iz algoritmov",
      createdByUserId: "u-1",
      createdAt: new Date().toISOString(),
    },
  ],
  memberships: [
    {
      id: "m-1",
      userId: "u-1",
      groupId: "g-1",
      role: "moderator",
      joinedAt: new Date().toISOString(),
    },
  ],
  challenges: [],
};

let counter = 1;

export function generateId(prefix: string): string {
  counter += 1;
  return `${prefix}-${Date.now()}-${counter}`;
}

export function seedDemoData(): void {
  if (store.goals.length > 0) {
    return;
  }

  const demoGoal: Goal = {
    id: generateId("goal"),
    title: "Priprava na izpit iz matematike",
    description: "Predelaj poglavja 1-4 in reši stare naloge",
    deadline: "2026-04-10T20:00:00.000Z",
    priority: "high",
    status: "in_progress",
    userId: "u-1",
  };

  const demoTask: Task = {
    id: generateId("task"),
    title: "Reševanje diferencialnih enačb",
    description: "15 nalog z rešitvami",
    deadline: "2026-03-25T18:00:00.000Z",
    status: "planned",
    estimatedMinutes: 90,
    goalId: demoGoal.id,
  };

  const demoSprint: StudySprint = {
    id: generateId("sprint"),
    startTime: "2026-03-20T16:00:00.000Z",
    endTime: "2026-03-20T16:25:00.000Z",
    durationMinutes: 25,
    status: "active",
    notes: "Fokus na uvodne naloge",
    userId: "u-1",
    taskId: demoTask.id,
  };

  const demoProgress: Progress = {
    id: generateId("progress"),
    date: "2026-03-20",
    completedTasks: 2,
    sprintCount: 3,
    totalStudyMinutes: 75,
    completionPercentage: 45,
    userId: "u-1",
  };

  const demoReminder: Reminder = {
    id: generateId("reminder"),
    type: "task",
    scheduledFor: "2026-03-21T08:00:00.000Z",
    status: "pending",
    channel: "push",
    userId: "u-1",
    taskId: demoTask.id,
  };

  const demoChallenge: GroupChallenge = {
    id: generateId("challenge"),
    title: "7 dni, 7 sprintov",
    description: "Vsak član izvede vsaj en sprint na dan",
    startDate: "2026-03-21",
    endDate: "2026-03-27",
    targetValue: 7,
    status: "planned",
    groupId: "g-1",
  };

  store.goals.push(demoGoal);
  store.tasks.push(demoTask);
  store.sprints.push(demoSprint);
  store.progress.push(demoProgress);
  store.reminders.push(demoReminder);
  store.challenges.push(demoChallenge);
}
