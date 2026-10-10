import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { sql } from "drizzle-orm";
import { buildApp } from "../apps/api/src/app.js";
import { createDatabase } from "../apps/api/src/db.js";
import { setupResources } from "../apps/api/src/setup.js";
const url =
  process.env.TEST_DATABASE_URL ||
  "postgresql://dayly_app@127.0.0.1:55432/dayly_test";
if (process.env.NODE_ENV === "production")
  throw new Error("Leak fixtures must never run in production");
const db = createDatabase(url),
  app = buildApp(db);
const covered = new Set<string>();
const results: { endpoint: string; result: string }[] = [];
const mark = (method: string, path: string) => {
  covered.add(`${method} ${path}`);
  results.push({ endpoint: `${method} ${path}`, result: "PASS" });
};
try {
  async function company(label: string) {
    const signup = await app.inject({
      method: "POST",
      url: "/api/auth/signup-admin",
      payload: {
        companyName: `Leak ${label}`,
        name: `Admin ${label}`,
        email: `${randomUUID()}@example.test`,
        password: "local-leak-test-passphrase",
      },
    });
    assert.equal(signup.statusCode, 200);
    const cookie = String(signup.headers["set-cookie"]).split(";")[0];
    const me = (
      await app.inject({ url: "/api/me", headers: { cookie } })
    ).json();
    const tenant = (
      await db.pool.query("SELECT id FROM companies WHERE code=$1", [
        me.companyCode,
      ])
    ).rows[0].id;
    return { cookie, tenant };
  }
  const a = await company("A"),
    b = await company("B");
  const aIds: Record<string, string> = {},
    bIds: Record<string, string> = {};
  function payloadFor(resource: string, ids: Record<string, string>) {
    switch (resource) {
      case "departments":
        return { name: "Workshop" };
      case "sections":
        return { department_id: ids.departments, name: "Yard" };
      case "equipment_types":
        return { section_id: ids.sections, name: "Tractor" };
      case "equipment":
        return {
          equipment_type_id: ids.equipment_types,
          code: randomUUID(),
          label: "Unit",
        };
      case "detail_fields":
        return {
          equipment_type_id: ids.equipment_types,
          key: "meter",
          label: "Meter",
          kind: "text",
          position: 0,
        };
      default:
        return {
          equipment_type_id: ids.equipment_types,
          text: "Check brakes",
          position: 0,
        };
    }
  }
  async function seed(who: typeof a, ids: Record<string, string>) {
    for (const resource of setupResources) {
      const r = await app.inject({
        method: "POST",
        url: `/api/${resource}`,
        headers: { cookie: who.cookie },
        payload: payloadFor(resource, ids),
      });
      assert.equal(r.statusCode, 200, r.body);
      ids[resource] = r.json().id;
    }
    const invite = await app.inject({
      method: "POST",
      url: "/api/invites",
      headers: { cookie: who.cookie },
      payload: {},
    });
    assert.equal(invite.statusCode, 200);
    ids.invites = invite.json().id;
    const joined = await app.inject({
      method: "POST",
      url: "/api/auth/join",
      payload: {
        code: invite.json().code,
        name: "Leak Technician",
        username: "tech",
        password: "local-leak-test-passphrase",
      },
    });
    assert.equal(joined.statusCode, 200);
    const techCookie = String(joined.headers["set-cookie"]).split(";")[0];
    const tech = (
      await app.inject({ url: "/api/me", headers: { cookie: techCookie } })
    ).json();
    await db.withTenant(who.tenant, async (tx) => {
      const inspection = randomUUID();
      await tx.execute(
        sql`INSERT INTO inspections(id,tenant_id,equipment_id,technician_user_id,started_at,completed_at,details,has_faults) VALUES(${inspection},${who.tenant},${ids.equipment},${tech.id},now(),now(),'{}',true)`,
      );
      await tx.execute(
        sql`INSERT INTO inspection_items(tenant_id,inspection_id,checklist_item_id,item_text,position,result,comment) VALUES(${who.tenant},${inspection},${ids.checklist_items},'Check brakes',0,'not_ok','Needs inspection')`,
      );
    });
    return techCookie;
  }
  await seed(a, aIds);
  const bTech = await seed(b, bIds);
  const business = [
    ...setupResources,
    "invites",
    "inspections",
    "inspection_items",
  ];
  async function snapshot(tenant: string) {
    return db.withTenant(tenant, async (tx) => {
      const out: Record<string, unknown[]> = {};
      for (const table of business)
        out[table] = (
          await tx.execute(
            sql`SELECT * FROM ${sql.identifier(table)} ORDER BY id`,
          )
        ).rows;
      return out;
    });
  }
  const before = await snapshot(a.tenant);
  for (const resource of setupResources) {
    const base = `/api/${resource}`,
      id = aIds[resource];
    const list = await app.inject({
      url: `${base}?tenant_id=${a.tenant}&companyId=${a.tenant}`,
      headers: { cookie: b.cookie },
    });
    assert.equal(list.statusCode, 200);
    assert.ok(
      list.json().every((r: { tenant_id: string }) => r.tenant_id === b.tenant),
    );
    mark("GET", base);
    for (const method of ["GET", "PATCH", "DELETE"] as const) {
      const r = await app.inject({
        method,
        url: `${base}/${id}`,
        headers: { cookie: b.cookie },
        ...(method === "PATCH" ? { payload: { active: false } } : {}),
      });
      assert.equal(r.statusCode, 404, r.body);
      mark(method, `${base}/:id`);
    }
    const own = payloadFor(resource, bIds);
    if (resource === "detail_fields") Object.assign(own, { key: "injected" });
    const injected = await app.inject({
      method: "POST",
      url: base,
      headers: { cookie: b.cookie },
      payload: { ...own, tenant_id: a.tenant, companyId: a.tenant },
    });
    assert.equal(injected.statusCode, 200, injected.body);
    assert.equal(injected.json().tenant_id, b.tenant);
    if (resource !== "departments") {
      const malicious = payloadFor(resource, aIds);
      if (resource === "detail_fields")
        Object.assign(malicious, { key: "foreign" });
      const r = await app.inject({
        method: "POST",
        url: base,
        headers: { cookie: b.cookie },
        payload: malicious,
      });
      assert.equal(r.statusCode, 404, r.body);
      const patch = await app.inject({
        method: "PATCH",
        url: `${base}/${bIds[resource]}`,
        headers: { cookie: b.cookie },
        payload: malicious,
      });
      assert.equal(patch.statusCode, 404, patch.body);
    }
    mark("POST", base);
    for (const method of ["GET", "POST"] as const)
      assert.equal(
        (
          await app.inject({
            method,
            url: base,
            headers: { cookie: bTech },
            ...(method === "POST" ? { payload: own } : {}),
          })
        ).statusCode,
        403,
      );
    if (resource === "detail_fields" || resource === "checklist_items") {
      assert.equal(
        (
          await app.inject({
            method: "POST",
            url: `${base}/reorder`,
            headers: { cookie: b.cookie },
            payload: { ids: [id] },
          })
        ).statusCode,
        404,
      );
      mark("POST", `${base}/reorder`);
    }
  }
  const invites = await app.inject({
    url: "/api/invites",
    headers: { cookie: b.cookie },
  });
  assert.ok(!invites.json().some((i: { id: string }) => i.id === aIds.invites));
  mark("GET", "/api/invites");
  assert.equal(
    (
      await app.inject({
        method: "DELETE",
        url: `/api/invites/${aIds.invites}`,
        headers: { cookie: b.cookie },
      })
    ).statusCode,
    404,
  );
  mark("DELETE", "/api/invites/:id");
  assert.equal(
    (
      await app.inject({
        method: "POST",
        url: "/api/invites",
        headers: { cookie: bTech },
        payload: {},
      })
    ).statusCode,
    403,
  );
  mark("POST", "/api/invites");
  assert.deepEqual(
    await snapshot(a.tenant),
    before,
    "Tenant A changed after cross-tenant attacks",
  );
  for (const table of business) {
    assert.equal(
      (await db.pool.query(`SELECT count(*)::int AS n FROM "${table}"`)).rows[0]
        .n,
      0,
      `${table} visible without tenant`,
    );
    results.push({ endpoint: `RLS ${table} without context`, result: "PASS" });
  }
  await app.ready();
  const registry = (
    app as unknown as { daylyRoutes: { method: string; url: string }[] }
  ).daylyRoutes;
  const excluded: Record<string, string> = {
    "GET /api/health": "Public health contract; tested separately",
    "POST /api/auth/signup-admin":
      "Public identity creation; duplicate and login tests in auth suite",
    "POST /api/auth/login": "Identity authentication; auth test suite",
    "POST /api/auth/join":
      "Public invite claim; both tenant memberships seeded and atomic invite tests",
    "POST /api/auth/logout": "Session-only revocation",
    "GET /api/me":
      "Session identity; both tenant identities asserted during setup",
  };
  for (const route of registry) {
    if (route.method === "HEAD") continue;
    const key = `${route.method} ${route.url}`;
    if (!covered.has(key)) {
      assert.ok(excluded[key], `Uncovered route: ${key}`);
      results.push({ endpoint: key, result: `EXCLUDED: ${excluded[key]}` });
    }
  }
  console.table(results);
  console.log(
    "Tenant leak test PASS: route coverage complete, tenant A unchanged.",
  );
} finally {
  await app.close();
  await db.pool.end();
}
