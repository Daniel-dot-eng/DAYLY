import Fastify from 'fastify';
import { healthSchema } from '@dayly/shared';
import { readConfig } from './config.js';
export function buildApp() {
  const app = Fastify({logger:false,bodyLimit:1048576});
  app.get('/api/health', async () => healthSchema.parse({status:'ok',version:readConfig().APP_VERSION,time:new Date().toISOString()}));
  return app;
}
