import { app } from "./app";

const HOST = "127.0.0.1";
const PORT = Number(process.env.PORT) || 3000;

const server = app.listen(PORT, HOST, () => {
  console.log(`StudySprint odjemalec REST server tece na http://${HOST}:${PORT}`);
});

server.on("error", (err: NodeJS.ErrnoException) => {
  if (err.code === "EADDRINUSE") {
    console.error(`Vrata ${PORT} so ze v uporabi. Ustavite obstojeci proces ali nastavite PORT.`);
    process.exit(1);
  }

  console.error("Napaka streznika:", err.message);
  process.exit(1);
});
