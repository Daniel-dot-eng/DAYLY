import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { sql } from "drizzle-orm";
import { z } from "zod";
export function createDatabase(url: string) {
  const pool = new pg.Pool({ connectionString: url, max: 10 });
  const db = drizzle(pool);
  type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
  async function withTenant<T>(
    tenantId: string,
    fn: (tx: Transaction) => Promise<T>,
  ): Promise<T> {
    z.string().uuid().parse(tenantId);
    return db.transaction(async (tx) => {
      await tx.execute(
        sql`select set_config('app.tenant_id', ${tenantId}, true)`,
      );
      return fn(tx);
    });
  }
  return { pool, db, withTenant };
}
export type Database = ReturnType<typeof createDatabase>;
