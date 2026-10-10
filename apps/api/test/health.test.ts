import { test } from "node:test";
import assert from "node:assert/strict";
import { buildApp } from "../src/app.js";
import { healthSchema } from "@dayly/shared";
import { readConfig } from "../src/config.js";
test("health response matches contract", async () => {
  const app = buildApp();
  const response = await app.inject({ url: "/api/health" });
  assert.equal(response.statusCode, 200);
  healthSchema.parse(response.json());
  await app.close();
});
test("invalid startup config fails", () => {
  assert.throws(() => readConfig({ PORT: "not-a-port" }));
});
