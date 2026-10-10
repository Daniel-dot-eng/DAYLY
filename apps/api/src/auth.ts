import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import cookie from "@fastify/cookie";
import rateLimit from "@fastify/rate-limit";
import { hash, verify, Algorithm } from "@node-rs/argon2";
import { randomBytes, randomUUID, createHash, randomInt } from "node:crypto";
import { z } from "zod";
import { sql } from "drizzle-orm";
import type { Database } from "./db.js";
export const digest = (s: string) =>
  createHash("sha256").update(s).digest("hex");
const passwordSchema = z.string().min(10).max(200);
const authReply = z.object({ ok: z.literal(true) });
const meSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  role: z.enum(["admin", "technician"]),
  companyName: z.string(),
  companyCode: z.string(),
});
export type Identity = {
  id: string;
  tenantId: string;
  role: "admin" | "technician";
  name: string;
  companyName: string;
  companyCode: string;
};
export class HttpError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
  }
}
export async function identity(
  database: Database,
  request: FastifyRequest,
): Promise<Identity> {
  const token = request.cookies.dayly_session;
  if (!token) throw new HttpError(401, "Authentication required");
  const result = await database.pool.query(
    'SELECT u.id,u.name,m.role,c.id AS "tenantId",c.name AS "companyName",c.code AS "companyCode" FROM sessions s JOIN users u ON u.id=s.user_id JOIN companies c ON c.id=s.company_id JOIN members m ON m.company_id=c.id AND m.user_id=u.id WHERE s.token_hash=$1 AND s.expires_at>now()',
    [digest(token)],
  );
  if (!result.rows[0]) throw new HttpError(401, "Authentication required");
  return result.rows[0] as Identity;
}
export const requireAdmin = (who: Identity) => {
  if (who.role !== "admin")
    throw new HttpError(403, "Admin permission required");
};
async function session(
  database: Database,
  reply: FastifyReply,
  userId: string,
  tenantId: string,
) {
  const token = randomBytes(32).toString("base64url");
  await database.pool.query(
    "INSERT INTO sessions(token_hash,user_id,company_id,expires_at) VALUES($1,$2,$3,now()+interval '7 days')",
    [digest(token), userId, tenantId],
  );
  reply.setCookie("dayly_session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 604800,
  });
}
export async function authRoutes(app: FastifyInstance, database: Database) {
  await app.register(cookie);
  await app.register(rateLimit, {
    global: false,
    max: 10,
    timeWindow: "1 minute",
  });
  const limited = {
    config: { rateLimit: { max: 10, timeWindow: "1 minute" } },
  };
  app.post("/api/auth/signup-admin", limited, async (request, reply) => {
    const body = z
      .object({
        companyName: z.string().trim().min(1).max(150),
        name: z.string().trim().min(1).max(100),
        email: z.string().email().max(254),
        password: passwordSchema,
      })
      .strict()
      .parse(request.body);
    const passwordHash = await hash(body.password, {
      algorithm: Algorithm.Argon2id,
      memoryCost: 19456,
      timeCost: 2,
      parallelism: 1,
    });
    const client = await database.pool.connect();
    let userId = "";
    let tenantId = "";
    try {
      await client.query("BEGIN");
      const company = await client.query(
        "INSERT INTO companies(name,code) VALUES($1,$2) RETURNING id",
        [body.companyName, randomBytes(5).toString("hex").toUpperCase()],
      );
      tenantId = company.rows[0].id;
      const user = await client.query(
        "INSERT INTO users(name,login,password_hash) VALUES($1,$2,$3) RETURNING id",
        [body.name, body.email.toLowerCase(), passwordHash],
      );
      userId = user.rows[0].id;
      await client.query(
        "INSERT INTO members(company_id,user_id,role) VALUES($1,$2,'admin')",
        [tenantId, userId],
      );
      await client.query("COMMIT");
    } catch {
      await client.query("ROLLBACK");
      throw new HttpError(400, "Unable to create account");
    } finally {
      client.release();
    }
    await session(database, reply, userId, tenantId);
    return authReply.parse({ ok: true });
  });
  app.post("/api/auth/login", limited, async (request, reply) => {
    const body = z
      .object({
        login: z.string().trim().min(1).max(254),
        password: passwordSchema,
        companyCode: z.string().trim().max(40).optional(),
      })
      .strict()
      .parse(request.body);
    const login = body.companyCode
      ? `${body.login.toLowerCase()}@${body.companyCode.toUpperCase()}`
      : body.login.toLowerCase();
    const found = await database.pool.query(
      "SELECT u.id,u.password_hash,m.company_id FROM users u JOIN members m ON m.user_id=u.id WHERE u.login=$1",
      [login],
    );
    const user = found.rows[0];
    if (!user || !(await verify(user.password_hash, body.password)))
      throw new HttpError(401, "Invalid login or password");
    await session(database, reply, user.id, user.company_id);
    return authReply.parse({ ok: true });
  });
  app.post("/api/auth/logout", async (request, reply) => {
    if (request.cookies.dayly_session)
      await database.pool.query("DELETE FROM sessions WHERE token_hash=$1", [
        digest(request.cookies.dayly_session),
      ]);
    reply.clearCookie("dayly_session", { path: "/" });
    return authReply.parse({ ok: true });
  });
  app.get("/api/me", async (request) => {
    const who = await identity(database, request);
    return meSchema.parse(who);
  });
  app.post("/api/invites", async (request) => {
    const who = await identity(database, request);
    requireAdmin(who);
    const body = z
      .object({ maxUses: z.number().int().min(1).max(1000).default(25) })
      .strict()
      .parse(request.body || {});
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const code = Array.from(
      { length: 8 },
      () => alphabet[randomInt(alphabet.length)],
    ).join("");
    const id = randomUUID();
    await database.withTenant(who.tenantId, async (tx) => {
      await tx.execute(
        sql`INSERT INTO invites(id,tenant_id,code,max_uses,expires_at,created_by) VALUES(${id},${who.tenantId},${code},${body.maxUses},now()+interval '7 days',${who.id})`,
      );
      await tx.execute(
        sql`INSERT INTO auth_invite_lookup(code_hash,tenant_id,invite_id) VALUES(${digest(code)},${who.tenantId},${id})`,
      );
    });
    return z
      .object({ id: z.string().uuid(), code: z.string().length(8) })
      .parse({ id, code });
  });
  app.get("/api/invites", async (request) => {
    const who = await identity(database, request);
    requireAdmin(who);
    const rows = await database.withTenant(who.tenantId, (tx) =>
      tx.execute(
        sql`SELECT id,code,expires_at::text,max_uses,uses,revoked FROM invites ORDER BY created_at DESC`,
      ),
    );
    return z
      .array(
        z.object({
          id: z.string().uuid(),
          code: z.string(),
          expires_at: z.string(),
          max_uses: z.number(),
          uses: z.number(),
          revoked: z.boolean(),
        }),
      )
      .parse(rows.rows);
  });
  app.delete("/api/invites/:id", async (request) => {
    const who = await identity(database, request);
    requireAdmin(who);
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const result = await database.withTenant(who.tenantId, (tx) =>
      tx.execute(
        sql`UPDATE invites SET revoked=true WHERE id=${id} RETURNING id`,
      ),
    );
    if (!result.rows.length) throw new HttpError(404, "Not found");
    return authReply.parse({ ok: true });
  });
  app.post("/api/auth/join", limited, async (request, reply) => {
    const body = z
      .object({
        code: z.string().trim().length(8),
        name: z.string().trim().min(1).max(100),
        username: z
          .string()
          .trim()
          .regex(/^[a-zA-Z0-9_-]{3,40}$/),
        password: passwordSchema,
      })
      .strict()
      .parse(request.body);
    const lookup = await database.pool.query(
      "SELECT l.tenant_id,l.invite_id,c.code FROM auth_invite_lookup l JOIN companies c ON c.id=l.tenant_id WHERE l.code_hash=$1",
      [digest(body.code.toUpperCase())],
    );
    const found = lookup.rows[0];
    if (!found) throw new HttpError(400, "Unable to join team");
    const passwordHash = await hash(body.password, {
      algorithm: Algorithm.Argon2id,
      memoryCost: 19456,
      timeCost: 2,
      parallelism: 1,
    });
    const userId = randomUUID();
    try {
      await database.withTenant(found.tenant_id, async (tx) => {
        const invite = await tx.execute(
          sql`UPDATE invites SET uses=uses+1 WHERE id=${found.invite_id} AND NOT revoked AND expires_at>now() AND uses<max_uses RETURNING id`,
        );
        if (!invite.rows.length) throw new Error("Invalid invite");
        await tx.execute(
          sql`INSERT INTO users(id,name,login,password_hash) VALUES(${userId},${body.name},${body.username.toLowerCase() + "@" + found.code},${passwordHash})`,
        );
        await tx.execute(
          sql`INSERT INTO members(company_id,user_id,role) VALUES(${found.tenant_id},${userId},'technician')`,
        );
      });
    } catch {
      throw new HttpError(400, "Unable to join team");
    }
    await session(database, reply, userId, found.tenant_id);
    return authReply.parse({ ok: true });
  });
}
