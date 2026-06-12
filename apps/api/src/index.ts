import cors from "cors";
import express from "express";
import { config } from "./config.js";
import { routes } from "./routes.js";

const app = express();

app.use(
  cors({
    origin: config.webOrigin,
    credentials: true
  })
);
app.use(express.json({ limit: "2mb" }));
app.use("/api", routes);

app.use((error: unknown, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
  const message = error instanceof Error ? error.message : "Unknown API error";
  const status = message.includes("Upload") ? 400 : 500;
  response.status(status).json({ error: message });
});

app.listen(config.port, () => {
  console.log(`Smart DJ API listening on http://localhost:${config.port}`);
});
