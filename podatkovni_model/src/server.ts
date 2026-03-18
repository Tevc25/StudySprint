import { app } from './app';

const port = Number(process.env.PORT) || 3000;

app.listen(port, () => {
  console.log(`StudySprint član 2 server running at http://localhost:${port}`);
});
