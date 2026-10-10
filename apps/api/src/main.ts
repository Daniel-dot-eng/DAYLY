import { buildApp } from "./app.js";
import { readRuntimeConfig } from "./config.js";
import { createDatabase } from "./db.js";
const config = readRuntimeConfig();
const database = createDatabase(config.DATABASE_URL);
const app = buildApp(database);
app.addHook("onClose", async () => {
  await database.pool.end();
});
await app.listen({ port: config.PORT, host: config.HOST });
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => {
    void app.close();
  });
