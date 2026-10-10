import Fastify from 'fastify';
import { healthSchema } from '@dayly/shared';
import { readConfig } from './config.js';
import {createDatabase,type Database} from './db.js';
import {authRoutes,HttpError} from './auth.js';
import {ZodError} from 'zod';
export function buildApp(database?:Database) {
  const app = Fastify({logger:false,bodyLimit:1048576});
  app.get('/api/health', async () => healthSchema.parse({status:'ok',version:readConfig().APP_VERSION,time:new Date().toISOString()}));
  app.setErrorHandler((error,_request,reply)=>{const status=error instanceof ZodError?400:error instanceof HttpError?error.statusCode:500;reply.code(status).send({error:status===500?'Request failed':error instanceof ZodError?'Invalid input':error instanceof Error?error.message:'Request failed'});});
  if(database) void app.register(async child=>{await authRoutes(child,database);});
  return app;
}
