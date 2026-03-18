# StudySprint - član 2

Ta projekt implementira del seminarske naloge za **člana 2**:
- podrobnejša idejna zasnova preko Node.js HTTP strežnika,
- REST API za podatkovni model + sinhronizacijo,
- Node.js TypeScript odjemalec za demonstracijo klicev.

## Funkcionalnosti

### Prva naloga
- `GET /podatkovni-model/` vrne HTML dokument (lokalno serviran, z lokalnim CSS in ER diagramom).
- `GET /REST/` vrne `text/plain` opis REST storitev.

### Druga naloga
REST API z metodami `GET`, `POST`, `PUT`, `DELETE`, `PATCH`:
- Subjects, Goals, Tasks, StudySprints, Progress, Reminders, Groups,
  GroupMemberships, GroupChallenges.
- `POST /api/sync` simulira sinhronizacijo lokalnih sprememb.

Dodatno:
- TypeScript tipi za vse entitete,
- in-memory repository sloj (brez baze),
- osnovna validacija vhodov,
- enoten JSON format odgovorov in napak,
- modularna arhitektura (`routes`, `controllers`, `services`, `repositories`, ...),
- Swagger UI dokumentacija za testiranje API klicev.

## Zagon

V mapi `podatkovni_model`:

```bash
npm install
npm run dev
```

Strežnik se privzeto zažene na `http://localhost:3000`.

Swagger:
- UI: `http://localhost:3000/api-docs`
- JSON: `http://localhost:3000/api-docs.json`

## Build in produkcijski zagon

```bash
npm run build
npm start
```

## Zagon odjemalca

V ločenem terminalu (ob zagnanem strežniku):

```bash
npm run client
```

Odjemalec izvede tipičen CRUD + PATCH tok in pokliče `/api/sync`.

## Struktura

```text
podatkovni_model/
  public/
  src/
    client/
    controllers/
    data/
    middleware/
    models/
    repositories/
    routes/
    services/
    types/
    utils/
  package.json
  tsconfig.json
  README.md
```
