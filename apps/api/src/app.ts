import Fastify from "fastify";
import { healthSchema } from "@dayly/shared";
import { readConfig } from "./config.js";
import type { Database } from "./db.js";
import { authRoutes, HttpError } from "./auth.js";
import { ZodError } from "zod";
import { setupRoutes } from "./setup.js";
export function buildApp(database?: Database) {
  const app = Fastify({ logger: false, bodyLimit: 1048576 });
  const routeRegistry: { method: string; url: string }[] = [];
  app.decorate("daylyRoutes", routeRegistry);
  app.addHook("onRoute", (route) => {
    for (const method of Array.isArray(route.method)
      ? route.method
      : [route.method])
      routeRegistry.push({ method, url: route.url });
  });
  app.get("/api/health", async () =>
    healthSchema.parse({
      status: "ok",
      version: readConfig().APP_VERSION,
      time: new Date().toISOString(),
    }),
  );
  app.setErrorHandler((error, _request, reply) => {
    if (
      error instanceof Error &&
      "statusCode" in error &&
      error.statusCode === 429
    ) {
      return reply.code(429).send({ error: "Too many requests" });
    }
    const status =
      error instanceof ZodError
        ? 400
        : error instanceof HttpError
          ? error.statusCode
          : 500;
    reply.code(status).send({
      error:
        status === 500
          ? "Request failed"
          : error instanceof ZodError
            ? "Invalid input"
            : error instanceof Error
              ? error.message
              : "Request failed",
    });
  });
  if (database)
    void app.register(async (child) => {
      await authRoutes(child, database);
      await setupRoutes(child, database);
    });
  return app;
}
