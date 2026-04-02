export const restRouteContractText = `StudySprint REST storitve (član 2)

OAuth 2.0 avtentikacija
- POST /oauth/token
  Grant type: client_credentials
  Content-Type: application/x-www-form-urlencoded
  Parametri: grant_type=client_credentials, scope?
  Avtentikacija klienta: HTTP Basic (client_id:client_secret) ali client_id/client_secret v bodyju
- Vsi klici na /api/* zahtevajo glavo:
  Authorization: Bearer <access_token>

1) Subjects
- GET /api/subjects
- GET /api/subjects/:id
- POST /api/subjects
- PUT /api/subjects/:id
- DELETE /api/subjects/:id

2) Goals
- GET /api/goals
- GET /api/goals/:id
- POST /api/goals
- PUT /api/goals/:id
- DELETE /api/goals/:id

3) Tasks
- GET /api/tasks
- GET /api/tasks/:id
- POST /api/tasks
- PUT /api/tasks/:id
- DELETE /api/tasks/:id
- PATCH /api/tasks/:id/status

4) StudySprints
- GET /api/sprints
- GET /api/sprints/:id
- POST /api/sprints
- PUT /api/sprints/:id
- DELETE /api/sprints/:id
- PATCH /api/sprints/:id/finish

5) Progress
- GET /api/progress
- GET /api/progress/:id
- POST /api/progress
- PUT /api/progress/:id
- DELETE /api/progress/:id

6) Reminders
- GET /api/reminders
- GET /api/reminders/:id
- POST /api/reminders
- PUT /api/reminders/:id
- DELETE /api/reminders/:id

7) Groups
- GET /api/groups
- GET /api/groups/:id
- POST /api/groups
- PUT /api/groups/:id
- DELETE /api/groups/:id

8) Group memberships
- GET /api/group-memberships
- POST /api/group-memberships
- DELETE /api/group-memberships/:id

9) Group challenges
- GET /api/group-challenges
- GET /api/group-challenges/:id
- POST /api/group-challenges
- PUT /api/group-challenges/:id
- DELETE /api/group-challenges/:id

10) Sync
- POST /api/sync
  Vhod: deviceId, userId, lastSyncAt, localChanges[]
  Izhod: acceptedChanges, rejectedChanges, conflicts, serverTime, nextSyncToken

Osnovni vhodi/izhodi
- POST/PUT/PATCH sprejemajo JSON payload glede na entiteto.
- Odgovori so v enotni JSON obliki:
  { success: true|false, message: string, data?: any, errors?: string[] }

Status kode
- 200 OK
- 201 Created
- 204 No Content
- 401 Unauthorized
- 400 Bad Request
- 404 Not Found
- 409 Conflict
- 500 Internal Server Error

Sinhronizacija
- Klient hrani lokalne spremembe (offline-first) in jih periodično pošlje na /api/sync.
- Strežnik validira spremembe, označi sprejete/zavrnjene in vrne povratne informacije.
- Po uspešni sinhronizaciji se posodobi lastSyncAt uporabnika.`;
