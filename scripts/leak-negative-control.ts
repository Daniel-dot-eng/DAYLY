import pg from "pg";
import { spawnSync } from "node:child_process";
if (process.env.NODE_ENV === "production")
  throw new Error("Negative control is local test-only");
const url =
  process.env.MIGRATION_DATABASE_URL ||
  "postgresql://dayly_owner@127.0.0.1:55432/dayly_test";
const parsed = new URL(url);
if (
  !["127.0.0.1", "localhost"].includes(parsed.hostname) ||
  !parsed.pathname.endsWith("_test")
)
  throw new Error("Requires a local *_test database");
const client = new pg.Client({ connectionString: url });
await client.connect();
try {
  await client.query("ALTER TABLE departments DISABLE ROW LEVEL SECURITY");
  const result = spawnSync(
    process.execPath,
    ["--import", "tsx", "scripts/leak-test.ts"],
    { stdio: "pipe", encoding: "utf8", env: process.env },
  );
  if (result.status === 0)
    throw new Error("Negative control failed: policy break went undetected");
  console.log(
    "Deliberately disabled departments RLS: leak script exited non-zero as required.",
  );
  console.log(
    result.stderr
      .split("\n")
      .filter(
        (line) =>
          line.includes("AssertionError") || line.includes("false == true"),
      )
      .join("\n"),
  );
} finally {
  await client.query("ALTER TABLE departments ENABLE ROW LEVEL SECURITY");
  await client.query("ALTER TABLE departments FORCE ROW LEVEL SECURITY");
  await client.end();
}
const restored = spawnSync(
  process.execPath,
  ["--import", "tsx", "scripts/leak-test.ts"],
  { stdio: "inherit", env: process.env },
);
if (restored.status !== 0) process.exit(1);
