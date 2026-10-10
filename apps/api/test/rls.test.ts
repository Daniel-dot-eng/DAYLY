import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {sql} from 'drizzle-orm';
import {createDatabase} from '../src/db.js';
test('forced RLS isolates tenants and defaults to no rows',async()=>{
 const database=createDatabase(process.env.TEST_DATABASE_URL||'postgresql://dayly_app@127.0.0.1:55432/dayly_test');
 const a=randomUUID(),b=randomUUID();
 try{
 await database.pool.query('INSERT INTO companies(id,name,code) VALUES($1,$2,$3),($4,$5,$6)',[a,'A',a,b,'B',b]);
 await database.withTenant(a,tx=>tx.execute(sql`insert into departments(tenant_id,name) values(${a},'A department')`));
 await database.withTenant(b,tx=>tx.execute(sql`insert into departments(tenant_id,name) values(${b},'B department')`));
 const rows=await database.withTenant(a,tx=>tx.execute(sql`select * from departments`));
 assert.equal(rows.rows.length,1);assert.equal(rows.rows[0]?.tenant_id,a);
 assert.equal((await database.pool.query('SELECT * FROM departments')).rows.length,0);
 await assert.rejects(database.withTenant(a,tx=>tx.execute(sql`insert into departments(tenant_id,name) values(${b},'attack')`)));
 const role=await database.pool.query("select rolsuper,rolbypassrls from pg_roles where rolname=current_user");assert.equal(role.rows[0].rolsuper,false);assert.equal(role.rows[0].rolbypassrls,false);
 }finally{await database.pool.end();}
});
