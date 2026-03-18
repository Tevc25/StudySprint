import { Router } from "express";
import path from "node:path";

export const contentRouter = Router();
const publicDir = path.resolve(process.cwd(), "public");

contentRouter.get("/", (_req, res) => {
  res.type("text/plain; charset=utf-8").send(
    [
      "StudySprint - član 1 REST strežnik",
      "Poti:",
      "- /funkcionalnosti-odjemalca/",
      "- /posebnosti/",
      "- /api/*",
      "- /api-docs/",
    ].join("\n"),
  );
});

contentRouter.get("/funkcionalnosti-odjemalca/", (_req, res) => {
  res.sendFile(path.join(publicDir, "funkcionalnosti-odjemalca.html"));
});

contentRouter.get("/posebnosti/", (_req, res) => {
  res.sendFile(path.join(publicDir, "posebnosti.txt"));
});
