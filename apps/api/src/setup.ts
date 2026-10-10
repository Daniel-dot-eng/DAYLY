import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { sql } from "drizzle-orm";
import type { Database } from "./db.js";
import { identity, requireAdmin, HttpError } from "./auth.js";
const uuid = z.string().uuid();
const name = z.string().trim().min(1).max(200);
const position = z.number().int().min(0).max(10000);
const definitions = {
  departments: { schema: z.object({ name }), parent: null },
  sections: {
    schema: z.object({ department_id: uuid, name }),
    parent: ["department_id", "departments"],
  },
  equipment_types: {
    schema: z.object({ section_id: uuid, name }),
    parent: ["section_id", "sections"],
  },
  equipment: {
    schema: z.object({
      equipment_type_id: uuid,
      code: name,
      label: name,
      active: z.boolean().default(true),
    }),
    parent: ["equipment_type_id", "equipment_types"],
  },
  detail_fields: {
    schema: z.object({
      equipment_type_id: uuid,
      key: z.string().regex(/^[a-z][a-z0-9_]{0,39}$/),
      label: name,
      kind: z.enum(["text", "dropdown"]),
      required: z.boolean().default(false),
      options: z.array(name).max(100).default([]),
      position,
    }),
    parent: ["equipment_type_id", "equipment_types"],
  },
  checklist_items: {
    schema: z.object({
      equipment_type_id: uuid,
      text: name,
      position,
      active: z.boolean().default(true),
    }),
    parent: ["equipment_type_id", "equipment_types"],
  },
} as const;
export const setupResources = Object.keys(
  definitions,
) as (keyof typeof definitions)[];
export async function setupRoutes(app: FastifyInstance, database: Database) {
  for (const resource of setupResources) {
    const definition = definitions[resource];
    const table = sql.identifier(resource);
    const output = definition.schema.extend({
      id: uuid,
      tenant_id: uuid,
      active: z.boolean(),
      created_at: z
        .union([z.date(), z.string()])
        .transform((value) => new Date(value).toISOString()),
    });
    const parseOutput = (row: unknown) => output.parse(row);
    app.get(`/api/${resource}`, async (request) => {
      const who = await identity(database, request);
      requireAdmin(who);
      const query = z
        .object({ parentId: uuid.optional() })
        .strip()
        .parse(request.query);
      const rows = await database.withTenant(who.tenantId, (tx) =>
        tx.execute(
          sql`SELECT * FROM ${table} ${query.parentId && definition.parent ? sql`WHERE ${sql.identifier(definition.parent[0])}=${query.parentId}` : sql``} ORDER BY ${"position" in definition.schema.shape ? sql.identifier("position") : sql.identifier("created_at")},id`,
        ),
      );
      return rows.rows.map(parseOutput);
    });
    app.get(`/api/${resource}/:id`, async (request) => {
      const who = await identity(database, request);
      requireAdmin(who);
      const { id } = z.object({ id: uuid }).parse(request.params);
      const rows = await database.withTenant(who.tenantId, (tx) =>
        tx.execute(sql`SELECT * FROM ${table} WHERE id=${id}`),
      );
      if (!rows.rows[0]) throw new HttpError(404, "Not found");
      return parseOutput(rows.rows[0]);
    });
    app.post(`/api/${resource}`, async (request) => {
      const who = await identity(database, request);
      requireAdmin(who);
      const body = definition.schema.strip().parse(request.body) as Record<
        string,
        unknown
      >;
      const rows = await database.withTenant(who.tenantId, async (tx) => {
        if (definition.parent) {
          const parent = await tx.execute(
            sql`SELECT id FROM ${sql.identifier(definition.parent[1])} WHERE id=${body[definition.parent[0]]} AND active`,
          );
          if (!parent.rows.length) throw new HttpError(404, "Not found");
        }
        const keys = Object.keys(body);
        return tx.execute(
          sql`INSERT INTO ${table} (${sql.join(["tenant_id", ...keys].map(sql.identifier), sql`,`)}) VALUES (${sql.join(
            [
              who.tenantId,
              ...keys.map((k) =>
                Array.isArray(body[k]) ? JSON.stringify(body[k]) : body[k],
              ),
            ].map((v) => sql`${v}`),
            sql`,`,
          )}) RETURNING *`,
        );
      });
      return parseOutput(rows.rows[0]);
    });
    app.patch(`/api/${resource}/:id`, async (request) => {
      const who = await identity(database, request);
      requireAdmin(who);
      const { id } = z.object({ id: uuid }).parse(request.params);
      const body = definition.schema
        .partial()
        .extend({ active: z.boolean().optional() })
        .strip()
        .parse(request.body) as Record<string, unknown>;
      if (!Object.keys(body).length)
        throw new HttpError(400, "No changes supplied");
      const rows = await database.withTenant(who.tenantId, async (tx) => {
        if (definition.parent && body[definition.parent[0]]) {
          const parent = await tx.execute(
            sql`SELECT id FROM ${sql.identifier(definition.parent[1])} WHERE id=${body[definition.parent[0]]}`,
          );
          if (!parent.rows.length) throw new HttpError(404, "Not found");
        }
        return tx.execute(
          sql`UPDATE ${table} SET ${sql.join(
            Object.entries(body).map(
              ([k, v]) =>
                sql`${sql.identifier(k)}=${Array.isArray(v) ? JSON.stringify(v) : v}`,
            ),
            sql`,`,
          )} WHERE id=${id} RETURNING *`,
        );
      });
      if (!rows.rows[0]) throw new HttpError(404, "Not found");
      return parseOutput(rows.rows[0]);
    });
    // Disable rather than delete: preserves history and all existing parent references.
    app.delete(`/api/${resource}/:id`, async (request) => {
      const who = await identity(database, request);
      requireAdmin(who);
      const { id } = z.object({ id: uuid }).parse(request.params);
      const rows = await database.withTenant(who.tenantId, (tx) =>
        tx.execute(
          sql`UPDATE ${table} SET active=false WHERE id=${id} RETURNING id`,
        ),
      );
      if (!rows.rows.length) throw new HttpError(404, "Not found");
      return z.object({ ok: z.literal(true) }).parse({ ok: true });
    });
    if (resource === "detail_fields" || resource === "checklist_items")
      app.post(`/api/${resource}/reorder`, async (request) => {
        const who = await identity(database, request);
        requireAdmin(who);
        const body = z
          .object({ ids: z.array(uuid).min(1).max(500) })
          .strict()
          .parse(request.body);
        if (new Set(body.ids).size !== body.ids.length)
          throw new HttpError(400, "Duplicate identifiers");
        await database.withTenant(who.tenantId, async (tx) => {
          let parent: string | undefined;
          for (const [index, id] of body.ids.entries()) {
            const rows = await tx.execute(
              sql`UPDATE ${table} SET position=${index} WHERE id=${id} RETURNING equipment_type_id`,
            );
            if (!rows.rows.length) throw new HttpError(404, "Not found");
            const found = String(rows.rows[0]?.equipment_type_id);
            if (parent && parent !== found)
              throw new HttpError(
                400,
                "Items must have the same equipment type",
              );
            parent = found;
          }
        });
        return z.object({ ok: z.literal(true) }).parse({ ok: true });
      });
  }
}
