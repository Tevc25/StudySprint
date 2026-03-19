export const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'StudySprint API',
    version: '1.0.0',
    description: 'REST API za sistem StudySprint – upravljanje učnih ciljev, nalog, skupin in izzivov.',
  },
  servers: [{ url: 'http://localhost:3000' }],
  paths: {
    '/users': {
      get: { summary: 'Pridobi vse uporabnike', tags: ['Uporabniki'], responses: { '200': { description: 'Seznam uporabnikov' } } },
      post: {
        summary: 'Registracija novega uporabnika',
        tags: ['Uporabniki'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UserInput' },
              example: { name: 'Ana Novak', email: 'ana@example.com', password: 'geslo123', role: 'user' },
            },
          },
        },
        responses: { '201': { description: 'Uporabnik ustvarjen' }, '400': { description: 'Napačni podatki' } },
      },
    },
    '/users/login': {
      post: {
        summary: 'Prijava uporabnika',
        tags: ['Uporabniki'],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginInput' } } },
        },
        responses: { '200': { description: 'Prijava uspešna' }, '401': { description: 'Napačni podatki' } },
      },
    },
    '/users/{id}': {
      get: { summary: 'Pridobi uporabnika po ID', tags: ['Uporabniki'], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Uporabnik' }, '404': { description: 'Ni najden' } } },
      put: { summary: 'Posodobi uporabnika', tags: ['Uporabniki'], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Posodobljeno' }, '404': { description: 'Ni najden' } } },
      delete: { summary: 'Izbriši uporabnika', tags: ['Uporabniki'], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Izbrisan' }, '404': { description: 'Ni najden' } } },
    },
    '/goals': {
      get: { summary: 'Pridobi vse cilje', tags: ['Cilji'], responses: { '200': { description: 'Seznam ciljev' } } },
      post: {
        summary: 'Ustvari nov cilj',
        tags: ['Cilji'],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/GoalInput' }, example: { title: 'Naučiti se TypeScript', description: 'Osnove TypeScripta', deadline: '2025-06-01', userId: 'user123', status: 'active' } } } },
        responses: { '201': { description: 'Cilj ustvarjen' } },
      },
    },
    '/goals/{id}': {
      get: { summary: 'Pridobi cilj po ID', tags: ['Cilji'], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Cilj' }, '404': { description: 'Ni najden' } } },
      put: { summary: 'Posodobi cilj', tags: ['Cilji'], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Posodobljeno' } } },
      delete: { summary: 'Izbriši cilj', tags: ['Cilji'], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Izbrisan' } } },
    },
    '/tasks': {
      get: { summary: 'Pridobi vse naloge', tags: ['Naloge'], responses: { '200': { description: 'Seznam nalog' } } },
      post: {
        summary: 'Ustvari novo nalogo',
        tags: ['Naloge'],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/TaskInput' }, example: { title: 'Preberi poglavje 1', description: 'Uvod v TypeScript', deadline: '2025-05-01', goalId: 'goal123', userId: 'user123', completed: false } } } },
        responses: { '201': { description: 'Naloga ustvarjena' } },
      },
    },
    '/tasks/{id}': {
      get: { summary: 'Pridobi nalogo po ID', tags: ['Naloge'], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Naloga' } } },
      put: { summary: 'Posodobi nalogo', tags: ['Naloge'], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Posodobljeno' } } },
      delete: { summary: 'Izbriši nalogo', tags: ['Naloge'], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Izbrisana' } } },
    },
    '/progress/{userId}': {
      get: { summary: 'Napredek uporabnika', tags: ['Napredek'], parameters: [{ name: 'userId', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Statistika napredka' } } },
    },
    '/progress/goal/{goalId}': {
      get: { summary: 'Napredek pri cilju', tags: ['Napredek'], parameters: [{ name: 'goalId', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Napredek cilja' } } },
    },
    '/groups': {
      get: { summary: 'Pridobi vse skupine', tags: ['Skupine'], responses: { '200': { description: 'Seznam skupin' } } },
      post: {
        summary: 'Ustvari novo skupino',
        tags: ['Skupine'],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/GroupInput' }, example: { name: 'Skupina A', description: 'Učna skupina', moderatorId: 'user123' } } } },
        responses: { '201': { description: 'Skupina ustvarjena' } },
      },
    },
    '/groups/{id}': {
      get: { summary: 'Pridobi skupino po ID', tags: ['Skupine'], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Skupina' } } },
      put: { summary: 'Posodobi skupino', tags: ['Skupine'], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Posodobljeno' } } },
      delete: { summary: 'Izbriši skupino', tags: ['Skupine'], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Izbrisana' } } },
    },
    '/groups/{id}/join': {
      post: { summary: 'Pridruži se skupini', tags: ['Skupine'], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], requestBody: { required: true, content: { 'application/json': { example: { userId: 'user123' } } } }, responses: { '200': { description: 'Pridružen' } } },
    },
    '/groups/{id}/members': {
      get: { summary: 'Pridobi člane skupine', tags: ['Skupine'], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Seznam članov' } } },
      post: { summary: 'Dodaj člane skupini', tags: ['Skupine'], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], requestBody: { required: true, content: { 'application/json': { example: { userIds: ['user1', 'user2'] } } } }, responses: { '200': { description: 'Člani dodani' } } },
    },
    '/challenges': {
      get: { summary: 'Pridobi vse izzive', tags: ['Izzivi'], responses: { '200': { description: 'Seznam izzivov' } } },
      post: {
        summary: 'Ustvari nov izziv',
        tags: ['Izzivi'],
        requestBody: { required: true, content: { 'application/json': { example: { title: 'Izziv tedna', description: 'Preberite 50 strani', groupId: 'group123', startDate: '2025-05-01', endDate: '2025-05-07' } } } },
        responses: { '201': { description: 'Izziv ustvarjen' } },
      },
    },
    '/challenges/{id}': {
      get: { summary: 'Pridobi izziv po ID', tags: ['Izzivi'], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Izziv' } } },
      put: { summary: 'Posodobi izziv', tags: ['Izzivi'], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Posodobljeno' } } },
      delete: { summary: 'Izbriši izziv', tags: ['Izzivi'], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Izbrisan' } } },
    },
    '/challenges/{id}/start': {
      post: { summary: 'Zaženi izziv', tags: ['Izzivi'], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Izziv zagnan' } } },
    },
    '/challenges/{id}/participate': {
      post: { summary: 'Sodeluj v izzivu', tags: ['Izzivi'], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], requestBody: { required: true, content: { 'application/json': { example: { userId: 'user123' } } } }, responses: { '200': { description: 'Sodelovanje zabeleženo' } } },
    },
    '/notifications': {
      get: { summary: 'Pridobi vsa obvestila', tags: ['Obvestila'], responses: { '200': { description: 'Seznam obvestil' } } },
      post: {
        summary: 'Ustvari obvestilo',
        tags: ['Obvestila'],
        requestBody: { required: true, content: { 'application/json': { example: { title: 'Rok se bliža', message: 'Tvoj cilj poteče jutri', userId: 'user123', type: 'reminder' } } } },
        responses: { '201': { description: 'Obvestilo ustvarjeno' } },
      },
    },
    '/notifications/{id}': {
      get: { summary: 'Pridobi obvestilo po ID', tags: ['Obvestila'], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Obvestilo' } } },
      delete: { summary: 'Izbriši obvestilo', tags: ['Obvestila'], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Izbrisano' } } },
    },
  },
  components: {
    schemas: {
      UserInput: {
        type: 'object',
        required: ['name', 'email', 'password'],
        properties: {
          name: { type: 'string' },
          email: { type: 'string', format: 'email' },
          password: { type: 'string' },
          role: { type: 'string', enum: ['user', 'moderator'] },
        },
      },
      LoginInput: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string' },
          password: { type: 'string' },
        },
      },
      GoalInput: {
        type: 'object',
        required: ['title', 'userId'],
        properties: {
          title: { type: 'string' },
          description: { type: 'string' },
          deadline: { type: 'string' },
          userId: { type: 'string' },
          status: { type: 'string', enum: ['active', 'completed', 'paused'] },
        },
      },
      TaskInput: {
        type: 'object',
        required: ['title', 'userId'],
        properties: {
          title: { type: 'string' },
          description: { type: 'string' },
          deadline: { type: 'string' },
          goalId: { type: 'string' },
          userId: { type: 'string' },
          completed: { type: 'boolean' },
        },
      },
      GroupInput: {
        type: 'object',
        required: ['name', 'moderatorId'],
        properties: {
          name: { type: 'string' },
          description: { type: 'string' },
          moderatorId: { type: 'string' },
        },
      },
    },
  },
};
