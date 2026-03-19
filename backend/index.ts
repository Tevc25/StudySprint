import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import apiRouter from './src/api/index';
import { swaggerSpec } from './src/config/swagger';

const app = express();
const PORT = process.env.PORT ?? 3000;

// --- Middleware ---
app.use(express.json());
app.use('/public', express.static(path.join(__dirname, 'src/public')));

// --- Dokumentacijski endpointi ---
app.get('/funkcionalnosti-streznika', (_req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, 'src/views/funkcionalnosti.html'));
});

app.get('/posebnosti', (_req: Request, res: Response) => {
  res.type('text/plain; charset=utf-8').send(
    `StudySprint – Tehnične posebnosti implementacije
================================================

Uporabljene tehnologije:
  - Node.js z Express.js (HTTP strežnik, usmerjanje)
  - TypeScript (statično tipiziran JavaScript)
  - Firebase Admin SDK + Firestore (NoSQL podatkovna baza v oblaku)
  - swagger-ui-express (interaktivna API dokumentacija)
  - axios (HTTP odjemalec za demo skript)
  - dotenv (konfiguracija prek .env datoteke)

Struktura projekta:
  index.ts             – vstopna točka, inicializacija Express strežnika
  src/
    api/               – vse API poti in obdelovalci zahtev
      index.ts         – registracija vseh routerjev
      users.ts         – /users endpointi
      goals.ts         – /goals endpointi
      tasks.ts         – /tasks endpointi
      groups.ts        – /groups endpointi
      challenges.ts    – /challenges endpointi
      notifications.ts – /notifications endpointi
      progress.ts      – /progress endpointi
    services/          – poslovna logika, Firestore CRUD operacije
    models/            – TypeScript vmesniki (interfaces) za entitete
    config/
      firebase.ts      – inicializacija Firebase Admin SDK
      swagger.ts       – OpenAPI/Swagger specifikacija
    views/             – HTML dokumentacija (/funkcionalnosti-streznika)
    public/            – statične datoteke (UML diagram)
    client/
      client.ts        – demo Node.js odjemalec z axios

Način delovanja REST API-ja:
  - Strežnik posluša na portu iz .env (privzeto 3000)
  - Vse API poti so montirane pod korenskim URL-jem (npr. /users, /goals)
  - Zahtevki so JSON-kodirani (middleware express.json())
  - Odgovori vračajo ustrezne HTTP statusne kode (200, 201, 400, 404, 500)
  - Firebase Firestore se uporablja kot trajna shramba podatkov
  - Swagger dokumentacija je dostopna na /api-docs
  - HTML opis funkcionalnosti na /funkcionalnosti-streznika
  - Tehnične posebnosti na /posebnosti (ta dokument)

Konfiguracija (.env):
  PORT=3000
  FIREBASE_PROJECT_ID=...
  FIREBASE_PRIVATE_KEY=...
  FIREBASE_CLIENT_EMAIL=...
`
  );
});

// --- Swagger / OpenAPI dokumentacija ---
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// --- API poti ---
app.use('/', apiRouter);

// --- Error handling middleware ---
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Interna napaka strežnika', message: err.message });
});

// --- Zagon strežnika ---
app.listen(PORT, () => {
  console.log(`StudySprint strežnik teče na http://localhost:${PORT}`);
  console.log(`  Dokumentacija:  http://localhost:${PORT}/api-docs`);
  console.log(`  Funkcionalnosti: http://localhost:${PORT}/funkcionalnosti-streznika`);
  console.log(`  Posebnosti:     http://localhost:${PORT}/posebnosti`);
});
