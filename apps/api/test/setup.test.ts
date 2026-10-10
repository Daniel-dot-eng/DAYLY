import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { buildApp } from "../src/app.js";
import { createDatabase } from "../src/db.js";
test("admin configures demo hierarchy; tenant and technician access denied", async () => {
  const db = createDatabase(
    process.env.TEST_DATABASE_URL ||
      "postgresql://dayly_app@127.0.0.1:55432/dayly_test",
  );
  const app = buildApp(db);
  try {
    async function signup() {
      const r = await app.inject({
        method: "POST",
        url: "/api/auth/signup-admin",
        payload: {
          companyName: "A Workshop",
          name: "Admin",
          email: `${randomUUID()}@example.test`,
          password: "local-test-only-passphrase",
        },
      });
      assert.equal(r.statusCode, 200);
      return String(r.headers["set-cookie"]).split(";")[0];
    }
    const a = await signup(),
      b = await signup();
    async function create(resource: string, payload: object) {
      const r = await app.inject({
        method: "POST",
        url: `/api/${resource}`,
        headers: { cookie: a },
        payload,
      });
      assert.equal(r.statusCode, 200, r.body);
      return r.json();
    }
    const dept = await create("departments", { name: "Operations" });
    const section = await create("sections", {
      department_id: dept.id,
      name: "Workshop",
    });
    const type = await create("equipment_types", {
      section_id: section.id,
      name: "Tractor",
    });
    for (let n = 0; n < 3; n++)
      await create("equipment", {
        equipment_type_id: type.id,
        code: `UNIT-${n}`,
        label: `Unit ${n}`,
      });
    for (let n = 0; n < 2; n++)
      await create("detail_fields", {
        equipment_type_id: type.id,
        key: `field${n}`,
        label: `Field ${n}`,
        kind: "text",
        position: n,
      });
    for (let n = 0; n < 6; n++)
      await create("checklist_items", {
        equipment_type_id: type.id,
        text: `Check ${n}`,
        position: n,
      });
    assert.equal(
      (
        await app.inject({
          url: "/api/checklist_items",
          headers: { cookie: a },
        })
      ).json().length,
      6,
    );
    assert.deepEqual(
      (
        await app.inject({ url: "/api/departments", headers: { cookie: b } })
      ).json(),
      [],
    );
    assert.equal(
      (
        await app.inject({
          url: `/api/departments/${dept.id}`,
          headers: { cookie: b },
        })
      ).statusCode,
      404,
    );
    assert.equal(
      (
        await app.inject({
          method: "POST",
          url: "/api/sections",
          headers: { cookie: b },
          payload: { department_id: dept.id, name: "Attack" },
        })
      ).statusCode,
      404,
    );
    const invite = await create("invites", {});
    const joined = await app.inject({
      method: "POST",
      url: "/api/auth/join",
      payload: {
        code: invite.code,
        name: "Technician",
        username: "tech",
        password: "local-test-only-passphrase",
      },
    });
    const techCookie = String(joined.headers["set-cookie"]).split(";")[0];
    assert.equal(
      (
        await app.inject({
          url: "/api/departments",
          headers: { cookie: techCookie },
        })
      ).statusCode,
      403,
    );
    const deleted = await app.inject({
      method: "DELETE",
      url: `/api/equipment_types/${type.id}`,
      headers: { cookie: a },
    });
    assert.equal(deleted.statusCode, 200);
    assert.equal(
      (
        await app.inject({
          url: `/api/equipment_types/${type.id}`,
          headers: { cookie: a },
        })
      ).json().active,
      false,
    );
  } finally {
    await app.close();
    await db.pool.end();
  }
});
