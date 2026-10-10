import { buildApp } from "../apps/api/src/app.js";
import { createDatabase } from "../apps/api/src/db.js";
import { randomUUID } from "node:crypto";
if (process.env.NODE_ENV === "production")
  throw new Error("Demo seed is disabled in production");
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
const db = createDatabase(process.env.DATABASE_URL);
const app = buildApp(db);
try {
  const email = `demo-${randomUUID()}@example.test`;
  const password = `demo-${randomUUID()}`;
  const signup = await app.inject({
    method: "POST",
    url: "/api/auth/signup-admin",
    payload: {
      companyName: "Workshop Demo",
      name: "Demo Admin",
      email,
      password,
    },
  });
  if (signup.statusCode !== 200) throw new Error("Demo signup failed");
  const cookie = String(signup.headers["set-cookie"]).split(";")[0];
  async function create(resource: string, payload: unknown) {
    const response = await app.inject({
      method: "POST",
      url: `/api/${resource}`,
      headers: { cookie },
      payload: payload as object,
    });
    if (response.statusCode !== 200) throw new Error(`Demo ${resource} failed`);
    return response.json();
  }
  const department = await create("departments", { name: "Operations" });
  const section = await create("sections", {
    department_id: department.id,
    name: "Container Yard",
  });
  const type = await create("equipment_types", {
    section_id: section.id,
    name: "Terminal Tractor",
  });
  for (const n of ["01", "02", "03"])
    await create("equipment", {
      equipment_type_id: type.id,
      code: `TT-${n}`,
      label: `Tractor ${n}`,
    });
  await create("detail_fields", {
    equipment_type_id: type.id,
    key: "meter",
    label: "Hour meter",
    kind: "text",
    required: true,
    position: 0,
  });
  await create("detail_fields", {
    equipment_type_id: type.id,
    key: "shift",
    label: "Shift",
    kind: "dropdown",
    required: true,
    options: ["Day", "Night"],
    position: 1,
  });
  for (const [position, text] of [
    "Check oil level",
    "Check coolant level",
    "Check brakes",
    "Check lights",
    "Check tyres",
    "Check horn",
  ].entries())
    await create("checklist_items", {
      equipment_type_id: type.id,
      text,
      position,
    });
  console.log(`Local demo only: ${email} / ${password}`);
} finally {
  await app.close();
  await db.pool.end();
}
