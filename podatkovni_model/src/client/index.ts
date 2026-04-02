import axios, { AxiosResponse } from 'axios';
import { installOAuth } from './oauth';

const api = axios.create({
  baseURL: process.env.API_URL ?? 'http://localhost:3000/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
});

const log = <T>(label: string, response: AxiosResponse<T>): void => {
  console.log(`\n[${response.status}] ${label}`);
  console.log(JSON.stringify(response.data, null, 2));
};

const safeDelete = async (path: string): Promise<void> => {
  try {
    const response = await api.delete(path);
    console.log(`\n[${response.status}] DELETE ${path}`);
  } catch (error) {
    console.warn(`\nDELETE ${path} failed, skipping cleanup.`);
  }
};

const run = async (): Promise<void> => {
  const suffix = Date.now().toString();
  const userId = 'user-1';

  let subjectId = '';
  let goalId = '';
  let taskId = '';
  let sprintId = '';
  let progressId = '';
  let reminderId = '';
  let groupId = '';
  let groupMembershipId = '';
  let challengeId = '';

  try {
    await installOAuth(api);

    log('GET /subjects', await api.get('/subjects'));

    const createdSubject = await api.post('/subjects', {
      name: `Napredne podatkovne strukture ${suffix}`,
      description: 'Predmet za demo CRUD toka odjemalca.',
      color: '#F97316',
      userId
    });
    log('POST /subjects', createdSubject);
    subjectId = createdSubject.data.data.id as string;

    log('GET /subjects/:id', await api.get(`/subjects/${subjectId}`));

    log(
      'PUT /subjects/:id',
      await api.put(`/subjects/${subjectId}`, {
        name: `Napredne podatkovne strukture ${suffix} - posodobljeno`,
        description: 'Posodobljen opis predmeta.',
        color: '#EF4444',
        userId
      })
    );

    const createdGoal = await api.post('/goals', {
      title: `Pripraviti osnutek projekta ${suffix}`,
      description: 'Cilj za prikaz endpointov za goals.',
      deadline: '2026-04-01T20:00:00.000Z',
      priority: 'high',
      status: 'planned',
      userId,
      subjectId
    });
    log('POST /goals', createdGoal);
    goalId = createdGoal.data.data.id as string;

    log('GET /goals', await api.get('/goals'));
    log('GET /goals/:id', await api.get(`/goals/${goalId}`));

    log(
      'PUT /goals/:id',
      await api.put(`/goals/${goalId}`, {
        title: `Pripraviti osnutek projekta ${suffix} - update`,
        description: 'Cilj je v izvajanju.',
        deadline: '2026-04-02T20:00:00.000Z',
        priority: 'high',
        status: 'in_progress',
        userId,
        subjectId
      })
    );

    const createdTask = await api.post('/tasks', {
      title: `Implementirati API ${suffix}`,
      description: 'Naloga za test task endpointov.',
      deadline: '2026-03-30T18:00:00.000Z',
      status: 'todo',
      estimatedMinutes: 120,
      order: 1,
      goalId
    });
    log('POST /tasks', createdTask);
    taskId = createdTask.data.data.id as string;

    log('GET /tasks/:id', await api.get(`/tasks/${taskId}`));

    log(
      'PUT /tasks/:id',
      await api.put(`/tasks/${taskId}`, {
        title: `Implementirati API ${suffix} - update`,
        description: 'Naloga je v teku.',
        deadline: '2026-03-31T18:00:00.000Z',
        status: 'in_progress',
        estimatedMinutes: 110,
        order: 2,
        goalId
      })
    );

    log(
      'PATCH /tasks/:id/status',
      await api.patch(`/tasks/${taskId}/status`, {
        status: 'done'
      })
    );

    const createdSprint = await api.post('/sprints', {
      startTime: '2026-03-18T11:00:00.000Z',
      endTime: '2026-03-18T11:25:00.000Z',
      durationMinutes: 25,
      status: 'active',
      notes: 'Začetni sprint',
      userId,
      taskId
    });
    log('POST /sprints', createdSprint);
    sprintId = createdSprint.data.data.id as string;

    log('GET /sprints/:id', await api.get(`/sprints/${sprintId}`));

    log(
      'PUT /sprints/:id',
      await api.put(`/sprints/${sprintId}`, {
        startTime: '2026-03-18T11:05:00.000Z',
        endTime: '2026-03-18T11:30:00.000Z',
        durationMinutes: 25,
        status: 'active',
        notes: 'Posodobljen sprint',
        userId,
        taskId
      })
    );

    log(
      'PATCH /sprints/:id/finish',
      await api.patch(`/sprints/${sprintId}/finish`, {
        notes: 'Sprint uspešno zaključen.'
      })
    );

    const createdProgress = await api.post('/progress', {
      date: '2026-03-18',
      completedTasks: 2,
      sprintCount: 3,
      totalStudyMinutes: 75,
      completionPercentage: 66,
      userId
    });
    log('POST /progress', createdProgress);
    progressId = createdProgress.data.data.id as string;

    log('GET /progress/:id', await api.get(`/progress/${progressId}`));

    log(
      'PUT /progress/:id',
      await api.put(`/progress/${progressId}`, {
        date: '2026-03-18',
        completedTasks: 3,
        sprintCount: 4,
        totalStudyMinutes: 100,
        completionPercentage: 78,
        userId
      })
    );

    const createdReminder = await api.post('/reminders', {
      type: 'task',
      scheduledFor: '2026-03-19T07:30:00.000Z',
      status: 'pending',
      channel: 'push',
      userId,
      taskId
    });
    log('POST /reminders', createdReminder);
    reminderId = createdReminder.data.data.id as string;

    log('GET /reminders/:id', await api.get(`/reminders/${reminderId}`));

    log(
      'PUT /reminders/:id',
      await api.put(`/reminders/${reminderId}`, {
        type: 'task',
        scheduledFor: '2026-03-19T08:00:00.000Z',
        status: 'pending',
        channel: 'in_app',
        userId,
        taskId
      })
    );

    const createdGroup = await api.post('/groups', {
      name: `Skupina za test ${suffix}`,
      description: 'Skupina za testiranje groups endpointov.',
      createdByUserId: userId
    });
    log('POST /groups', createdGroup);
    groupId = createdGroup.data.data.id as string;

    log('GET /groups/:id', await api.get(`/groups/${groupId}`));

    log(
      'PUT /groups/:id',
      await api.put(`/groups/${groupId}`, {
        name: `Skupina za test ${suffix} - update`,
        description: 'Posodobljen opis skupine.',
        createdByUserId: userId
      })
    );

    const createdMembership = await api.post('/group-memberships', {
      userId: 'user-2',
      groupId,
      role: 'member'
    });
    log('POST /group-memberships', createdMembership);
    groupMembershipId = createdMembership.data.data.id as string;

    log('GET /group-memberships', await api.get('/group-memberships'));

    const createdChallenge = await api.post('/group-challenges', {
      title: `Izziv ${suffix}`,
      description: 'Skupinski izziv za demonstracijo endpointov.',
      startDate: '2026-03-20',
      endDate: '2026-03-25',
      targetValue: 7,
      status: 'planned',
      groupId
    });
    log('POST /group-challenges', createdChallenge);
    challengeId = createdChallenge.data.data.id as string;

    log('GET /group-challenges/:id', await api.get(`/group-challenges/${challengeId}`));

    log(
      'PUT /group-challenges/:id',
      await api.put(`/group-challenges/${challengeId}`, {
        title: `Izziv ${suffix} - update`,
        description: 'Izziv je aktiven.',
        startDate: '2026-03-20',
        endDate: '2026-03-26',
        targetValue: 8,
        status: 'active',
        groupId
      })
    );

    log(
      'POST /sync',
      await api.post('/sync', {
        deviceId: 'desktop-01',
        userId,
        lastSyncAt: '2026-03-18T10:00:00.000Z',
        localChanges: [
          {
            entity: 'tasks',
            operation: 'update',
            id: taskId,
            payload: { status: 'done' },
            timestamp: new Date().toISOString()
          },
          {
            entity: 'groupChallenges',
            operation: 'create',
            payload: { title: 'Lokalen osnutek' },
            timestamp: new Date().toISOString()
          }
        ]
      })
    );
  } catch (error) {
    console.error('\nClient run failed.');
    if (axios.isAxiosError(error)) {
      console.error(error.response?.status, error.response?.data ?? error.message);
    } else {
      console.error(error);
    }
  } finally {
    await safeDelete(`/group-challenges/${challengeId}`);
    await safeDelete(`/group-memberships/${groupMembershipId}`);
    await safeDelete(`/groups/${groupId}`);
    await safeDelete(`/reminders/${reminderId}`);
    await safeDelete(`/progress/${progressId}`);
    await safeDelete(`/sprints/${sprintId}`);
    await safeDelete(`/tasks/${taskId}`);
    await safeDelete(`/goals/${goalId}`);
    await safeDelete(`/subjects/${subjectId}`);

    console.log('\nDemo client flow completed.');
  }
};

run();
