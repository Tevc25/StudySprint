# StudySprint – odjemalec

TypeScript/Node.js Express backend + vanilla JS PWA. No frontend framework or bundler.

npm start       
--

server.ts                  # Express entry, serves /pwa/* statically, generates PNG icons
src/
  app.ts                   # Middleware (CORS, JSON), mounts routers
  data/store.ts            # In-memory store, persisted to .data/store.json on every mutation
  routes/api.ts            # CRUD REST API (/api/*), protected by OAuth middleware
  routes/push.routes.ts    # Push notification endpoints (/api/push/*)
  push/push.service.ts     # VAPID key management, in-memory subscription store
  middleware/require-oauth.ts
  types/index.ts           # All domain types (Goal, Task, StudySprint, …)
public/pwa/
  index.html               # SVG sprite + app shell
  app.js                   # All client-side logic (~1300 lines, no framework)
  style.css                # CSS custom properties, grid layout
  db.js                    # IndexedDB wrapper (goals, tasks, sprints, pendingSync)
  sw.js                    # Service Worker: cache-first assets, push, background sync
  manifest.json            # PWA manifest
  icons/                   # icon-192.png, icon-512.png, icon-maskable.png (generated on startup)
.data/store.json           # Persisted store (gitignored)
.auth/vapid-keys.json      # VAPID keys (gitignored)

Auth:
OAuth2 client_credentials flow. Token cached in `localStorage` (`ss_auth`). On 401 the client retries once with a fresh token. Credentials: `studysprint-cli` / `studysprint-secret`.

Voice:
App always responds with synthesized speech (`SpeechSynthesis`, `en-US`).
Implementation: `initVoiceCommands()` in `app.js`. `SpeechRecognition` runs in single-shot mode (not continuous) — one click = one utterance.

Modals:
All modals are native `<dialog>` elements opened with `.showModal()`. Backdrop click and Esc close them natively. IDs: `goalModal`, `taskModal`, `sprintModal`, `detailModal`, `confirmModal`.

SW cache invalidation:
`sw.js` whenever static assets change. Current version: `v5`.
