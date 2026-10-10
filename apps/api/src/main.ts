import { buildApp } from './app.js';
import { readConfig } from './config.js';
const config = readConfig();
const app = buildApp();
await app.listen({port:config.PORT,host:config.HOST});
for (const signal of ['SIGINT','SIGTERM']) process.on(signal, () => { void app.close(); });
