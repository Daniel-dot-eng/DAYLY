import { z } from "zod";
const schema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  HOST: z.string().default("0.0.0.0"),
  APP_VERSION: z.string().default("0.0.1"),
  DATABASE_URL: z.string().url().optional(),
});
export function readConfig(env: NodeJS.ProcessEnv = process.env) {
  return schema.parse(env);
}
export function readRuntimeConfig(env: NodeJS.ProcessEnv = process.env) {
  return schema.extend({ DATABASE_URL: z.string().url() }).parse(env);
}
