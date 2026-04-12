import express from "express";
import swaggerUi from "swagger-ui-express";
import { seedDemoData } from "./data/store";
import { openApiSpec } from "./docs/openapi";
import { oauthService } from "./auth/oauth.service";
import { errorHandler } from "./middleware/error-handler";
import { apiRouter } from "./routes/api";
import { oauthRouter } from "./routes/oauth.routes";

export const app = express();

seedDemoData();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openApiSpec, {
  swaggerOptions: {
    persistAuthorization: true
  }
}));
app.get("/api-docs.json", (_req, res) => {
  res.json(openApiSpec);
});

// OAuth endpoint (must be before requireOAuth middleware)
app.use("/oauth", oauthRouter);

// API endpoint with OAuth protection
app.use("/api", apiRouter);

// API root to show authentication info
app.get("/", (_req, res) => {
  const authMetadata = oauthService.getTokenEndpointMetadata();
  res.status(200).json({
    success: true,
    message: "StudySprint API is running.",
    data: {
      docs: "/api-docs/",
      openApi: "/api-docs.json",
      authentication: {
        grantType: "client_credentials",
        tokenUrl: "/oauth/token",
        clientId: authMetadata.clientId,
        allowedScopes: authMetadata.allowedScopes
      }
    }
  });
});

app.use((_req, res) => {
  res.status(404).json({ success: false, message: "Not found" });
});

app.use(errorHandler);
