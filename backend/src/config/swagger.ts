const secured = { security: [{ BearerAuth: [] }] };

const bearerResponses = {
  '401': { description: 'Manjka ali neveljaven Bearer žeton' },
};

export const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'StudySprint API',
    version: '2.0.0',
    description: `REST API za sistem StudySprint – upravljanje učnih ciljev, nalog, skupin in izzivov.

## Avtentikacija (OAuth 2.0)

API uporablja **OAuth 2.0 Resource Owner Password Credentials Grant** z JWT žetoni.

### Koraki za dostop do zaščitenih poti:

1. **Registracija** – \`POST /users\`
2. **Pridobitev žetona** – \`POST /auth/token\` z \`grant_type=password\`
3. **Uporaba žetona** – dodaj glavo \`Authorization: Bearer <access_token>\` vsaki zaščiteni zahtevi

### Katere poti so zaščitene?

| Pot | Zaščitena |
|-----|-----------|
| \`POST /auth/token\` | ❌ javna |
| \`/users\` | ❌ javna |
| \`/goals\` | ✅ Bearer žeton |
| \`/tasks\` | ✅ Bearer žeton |
| \`/groups\` | ✅ Bearer žeton |
| \`/challenges\` | ✅ Bearer žeton |
| \`/notifications\` | ✅ Bearer žeton |
| \`/progress\` | ✅ Bearer žeton |

### Kako preizkusiti v Swaggerju:
1. Klikni **Authorize** (🔒 gumb zgoraj desno)
2. V polje \`BearerAuth\` vnesi \`<access_token>\` iz odgovora \`POST /auth/token\`
3. Potrdi in vse zaščitene poti bodo avtomatsko pošiljale žeton`,
  },
  servers: [{ url: 'http://localhost:3000' }],

  // --- Globalna varnostna shema ---
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT žeton pridobljen z `POST /auth/token`. Vnesi samo vrednost žetona, brez besede "Bearer".',
      },
    },
    schemas: {
      TokenRequest: {
        type: 'object',
        required: ['grant_type', 'username', 'password'],
        properties: {
          grant_type: {
            type: 'string',
            enum: ['password'],
            description: 'OAuth 2.0 tip dodelitve – vedno "password"',
            example: 'password',
          },
          username: {
            type: 'string',
            format: 'email',
            description: 'E-poštni naslov uporabnika',
            example: 'ana@example.com',
          },
          password: {
            type: 'string',
            description: 'Geslo uporabnika',
            example: 'geslo123',
          },
          client_id: {
            type: 'string',
            description: 'Identifikator odjemalca (neobvezno)',
            example: 'studysprint-client',
          },
        },
      },
      TokenResponse: {
        type: 'object',
        properties: {
          access_token: { type: 'string', description: 'JWT žeton za dostop do zaščitenih poti' },
          token_type: { type: 'string', example: 'Bearer' },
          expires_in: { type: 'integer', description: 'Veljavnost žetona v sekundah', example: 3600 },
        },
      },
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

  paths: {
    // ===================== AUTH =====================
    '/auth/token': {
      post: {
        summary: 'Pridobi OAuth 2.0 dostopni žeton',
        description: `**OAuth 2.0 – Resource Owner Password Credentials Grant**

Pošlji e-pošto in geslo, prejmi JWT žeton. Žeton nato uporabi kot \`Authorization: Bearer <token>\` glavo pri vseh zaščitenih poteh.

Žeton velja **1 uro** (3600 sekund). Po preteku ga pridobi znova.`,
        tags: ['🔐 Avtentikacija'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/TokenRequest' },
              example: {
                grant_type: 'password',
                username: 'ana@example.com',
                password: 'geslo123',
                client_id: 'studysprint-client',
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Žeton uspešno pridobljen',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/TokenResponse' },
              },
            },
          },
          '400': { description: 'Napačen grant_type ali manjkajo parametri' },
          '401': { description: 'Napačni prijavni podatki' },
        },
      },
    },

    // ===================== USERS =====================
    '/users': {
      get: {
        summary: 'Pridobi vse uporabnike',
        description: 'Javna pot – ne zahteva žetona.',
        tags: ['Uporabniki'],
        responses: { '200': { description: 'Seznam uporabnikov' } },
      },
      post: {
        summary: 'Registracija novega uporabnika',
        description: 'Javna pot – ustvari nov račun. Po registraciji pridobi žeton z `POST /auth/token`.',
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
        summary: 'Prijava uporabnika (osnovna)',
        description: 'Vrne podatke o uporabniku. Za OAuth 2.0 žeton uporabi `POST /auth/token`.',
        tags: ['Uporabniki'],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginInput' } } },
        },
        responses: { '200': { description: 'Prijava uspešna' }, '401': { description: 'Napačni podatki' } },
      },
    },
    '/users/{id}': {
      get: {
        summary: 'Pridobi uporabnika po ID',
        tags: ['Uporabniki'],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Uporabnik' }, '404': { description: 'Ni najden' } },
      },
      put: {
        summary: 'Posodobi uporabnika',
        tags: ['Uporabniki'],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Posodobljeno' }, '404': { description: 'Ni najden' } },
      },
      delete: {
        summary: 'Izbriši uporabnika',
        tags: ['Uporabniki'],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Izbrisan' }, '404': { description: 'Ni najden' } },
      },
    },

    // ===================== GOALS =====================
    '/goals': {
      get: {
        ...secured,
        summary: 'Pridobi vse cilje',
        description: '🔒 Zahteva Bearer žeton.',
        tags: ['Cilji'],
        responses: { '200': { description: 'Seznam ciljev' }, ...bearerResponses },
      },
      post: {
        ...secured,
        summary: 'Ustvari nov cilj',
        description: '🔒 Zahteva Bearer žeton.',
        tags: ['Cilji'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/GoalInput' },
              example: { title: 'Naučiti se TypeScript', description: 'Osnove TypeScripta', deadline: '2025-06-01', userId: 'user123', status: 'active' },
            },
          },
        },
        responses: { '201': { description: 'Cilj ustvarjen' }, ...bearerResponses },
      },
    },
    '/goals/{id}': {
      get: { ...secured, summary: 'Pridobi cilj po ID', tags: ['Cilji'], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Cilj' }, '404': { description: 'Ni najden' }, ...bearerResponses } },
      put: { ...secured, summary: 'Posodobi cilj', tags: ['Cilji'], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Posodobljeno' }, ...bearerResponses } },
      delete: { ...secured, summary: 'Izbriši cilj', tags: ['Cilji'], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Izbrisan' }, ...bearerResponses } },
    },

    // ===================== TASKS =====================
    '/tasks': {
      get: {
        ...secured,
        summary: 'Pridobi vse naloge',
        description: '🔒 Zahteva Bearer žeton.',
        tags: ['Naloge'],
        responses: { '200': { description: 'Seznam nalog' }, ...bearerResponses },
      },
      post: {
        ...secured,
        summary: 'Ustvari novo nalogo',
        description: '🔒 Zahteva Bearer žeton.',
        tags: ['Naloge'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/TaskInput' },
              example: { title: 'Preberi poglavje 1', description: 'Uvod v TypeScript', deadline: '2025-05-01', goalId: 'goal123', userId: 'user123', completed: false },
            },
          },
        },
        responses: { '201': { description: 'Naloga ustvarjena' }, ...bearerResponses },
      },
    },
    '/tasks/{id}': {
      get: { ...secured, summary: 'Pridobi nalogo po ID', tags: ['Naloge'], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Naloga' }, ...bearerResponses } },
      put: { ...secured, summary: 'Posodobi nalogo', tags: ['Naloge'], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Posodobljeno' }, ...bearerResponses } },
      delete: { ...secured, summary: 'Izbriši nalogo', tags: ['Naloge'], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Izbrisana' }, ...bearerResponses } },
    },

    // ===================== PROGRESS =====================
    '/progress/{userId}': {
      get: {
        ...secured,
        summary: 'Napredek uporabnika',
        description: '🔒 Zahteva Bearer žeton.',
        tags: ['Napredek'],
        parameters: [{ name: 'userId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Statistika napredka' }, ...bearerResponses },
      },
    },
    '/progress/goal/{goalId}': {
      get: {
        ...secured,
        summary: 'Napredek pri cilju',
        description: '🔒 Zahteva Bearer žeton.',
        tags: ['Napredek'],
        parameters: [{ name: 'goalId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Napredek cilja' }, ...bearerResponses },
      },
    },

    // ===================== GROUPS =====================
    '/groups': {
      get: { ...secured, summary: 'Pridobi vse skupine', description: '🔒 Zahteva Bearer žeton.', tags: ['Skupine'], responses: { '200': { description: 'Seznam skupin' }, ...bearerResponses } },
      post: {
        ...secured,
        summary: 'Ustvari novo skupino',
        description: '🔒 Zahteva Bearer žeton.',
        tags: ['Skupine'],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/GroupInput' }, example: { name: 'Skupina A', description: 'Učna skupina', moderatorId: 'user123' } } } },
        responses: { '201': { description: 'Skupina ustvarjena' }, ...bearerResponses },
      },
    },
    '/groups/{id}': {
      get: { ...secured, summary: 'Pridobi skupino po ID', tags: ['Skupine'], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Skupina' }, ...bearerResponses } },
      put: { ...secured, summary: 'Posodobi skupino', tags: ['Skupine'], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Posodobljeno' }, ...bearerResponses } },
      delete: { ...secured, summary: 'Izbriši skupino', tags: ['Skupine'], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Izbrisana' }, ...bearerResponses } },
    },
    '/groups/{id}/join': {
      post: { ...secured, summary: 'Pridruži se skupini', tags: ['Skupine'], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], requestBody: { required: true, content: { 'application/json': { example: { userId: 'user123' } } } }, responses: { '200': { description: 'Pridružen' }, ...bearerResponses } },
    },
    '/groups/{id}/members': {
      get: { ...secured, summary: 'Pridobi člane skupine', tags: ['Skupine'], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Seznam članov' }, ...bearerResponses } },
      post: { ...secured, summary: 'Dodaj člane skupini', tags: ['Skupine'], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], requestBody: { required: true, content: { 'application/json': { example: { userIds: ['user1', 'user2'] } } } }, responses: { '200': { description: 'Člani dodani' }, ...bearerResponses } },
    },

    // ===================== CHALLENGES =====================
    '/challenges': {
      get: { ...secured, summary: 'Pridobi vse izzive', description: '🔒 Zahteva Bearer žeton.', tags: ['Izzivi'], responses: { '200': { description: 'Seznam izzivov' }, ...bearerResponses } },
      post: {
        ...secured,
        summary: 'Ustvari nov izziv',
        description: '🔒 Zahteva Bearer žeton.',
        tags: ['Izzivi'],
        requestBody: { required: true, content: { 'application/json': { example: { title: 'Izziv tedna', description: 'Preberite 50 strani', groupId: 'group123', startDate: '2025-05-01', endDate: '2025-05-07' } } } },
        responses: { '201': { description: 'Izziv ustvarjen' }, ...bearerResponses },
      },
    },
    '/challenges/{id}': {
      get: { ...secured, summary: 'Pridobi izziv po ID', tags: ['Izzivi'], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Izziv' }, ...bearerResponses } },
      put: { ...secured, summary: 'Posodobi izziv', tags: ['Izzivi'], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Posodobljeno' }, ...bearerResponses } },
      delete: { ...secured, summary: 'Izbriši izziv', tags: ['Izzivi'], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Izbrisan' }, ...bearerResponses } },
    },
    '/challenges/{id}/start': {
      post: { ...secured, summary: 'Zaženi izziv', tags: ['Izzivi'], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Izziv zagnan' }, ...bearerResponses } },
    },
    '/challenges/{id}/participate': {
      post: { ...secured, summary: 'Sodeluj v izzivu', tags: ['Izzivi'], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], requestBody: { required: true, content: { 'application/json': { example: { userId: 'user123' } } } }, responses: { '200': { description: 'Sodelovanje zabeleženo' }, ...bearerResponses } },
    },

    // ===================== NOTIFICATIONS =====================
    '/notifications': {
      get: { ...secured, summary: 'Pridobi vsa obvestila', description: '🔒 Zahteva Bearer žeton.', tags: ['Obvestila'], responses: { '200': { description: 'Seznam obvestil' }, ...bearerResponses } },
      post: {
        ...secured,
        summary: 'Ustvari obvestilo',
        description: '🔒 Zahteva Bearer žeton.',
        tags: ['Obvestila'],
        requestBody: { required: true, content: { 'application/json': { example: { title: 'Rok se bliža', message: 'Tvoj cilj poteče jutri', userId: 'user123', type: 'reminder' } } } },
        responses: { '201': { description: 'Obvestilo ustvarjeno' }, ...bearerResponses },
      },
    },
    '/notifications/{id}': {
      get: { ...secured, summary: 'Pridobi obvestilo po ID', tags: ['Obvestila'], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Obvestilo' }, ...bearerResponses } },
      delete: { ...secured, summary: 'Izbriši obvestilo', tags: ['Obvestila'], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Izbrisano' }, ...bearerResponses } },
    },
  },
};
