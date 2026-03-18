import express from "express";
import swaggerUi from "swagger-ui-express";
import { seedDemoData } from "./data/store";
import { openApiSpec } from "./docs/openapi";
import { apiRouter } from "./routes/api";

export const app = express();

seedDemoData();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openApiSpec));
app.get("/api-docs.json", (_req, res) => {
  res.json(openApiSpec);
});

app.use("/api", apiRouter);

app.use((_req, res) => {
  res.status(404).json({ success: false, message: "Not found" });
});
