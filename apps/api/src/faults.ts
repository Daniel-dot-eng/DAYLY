import { sql } from "drizzle-orm";
import { z } from "zod";
import type { Database } from "./db.js";
const faultSchema = z.object({
  id: z.string().uuid(),
  inspection_id: z.string().uuid(),
  item_text: z.string(),
  comment: z.string(),
  equipment_code: z.string(),
  equipment_type: z.string(),
  technician: z.string(),
  submitted_at: z.string(),
});
// Internal query helper for Batch B; business reads always retain the tenant transaction.
export async function queryFaults(database: Database, tenantId: string) {
  return database.withTenant(tenantId, async (tx) => {
    const result = await tx.execute(
      sql`SELECT item.id,item.inspection_id,item.item_text,item.comment,e.code AS equipment_code,t.name AS equipment_type,u.name AS technician,i.submitted_at::text FROM inspection_items item JOIN inspections i ON i.id=item.inspection_id AND i.tenant_id=item.tenant_id JOIN equipment e ON e.id=i.equipment_id AND e.tenant_id=i.tenant_id JOIN equipment_types t ON t.id=e.equipment_type_id AND t.tenant_id=e.tenant_id JOIN users u ON u.id=i.technician_user_id WHERE item.result='not_ok' ORDER BY i.submitted_at DESC,item.position`,
    );
    return z.array(faultSchema).parse(result.rows);
  });
}
