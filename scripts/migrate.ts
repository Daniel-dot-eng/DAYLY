import pg from 'pg';
import { readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const url=process.env.MIGRATION_DATABASE_URL;
if(!url) throw new Error('MIGRATION_DATABASE_URL is required');
const client=new pg.Client({connectionString:url});
await client.connect();
try {
 await client.query('CREATE TABLE IF NOT EXISTS dayly_migrations(name text PRIMARY KEY, applied_at timestamptz DEFAULT now())');
 const dir=fileURLToPath(new URL('../apps/api/migrations/',import.meta.url));
 for(const name of (await readdir(dir)).filter(n=>n.endsWith('.sql')).sort()){
  if((await client.query('SELECT 1 FROM dayly_migrations WHERE name=$1',[name])).rowCount)continue;
  await client.query('BEGIN');
  try{await client.query(await readFile(`${dir}/${name}`,'utf8'));await client.query('INSERT INTO dayly_migrations(name) VALUES($1)',[name]);await client.query('COMMIT');}catch(e){await client.query('ROLLBACK');throw e;}
 }
} finally {await client.end();}
