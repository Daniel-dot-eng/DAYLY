import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {createDatabase} from '../src/db.js';
import {buildApp} from '../src/app.js';
import {sql} from 'drizzle-orm';
test('signup, sessions and atomic invite constraints',async()=>{
 const db=createDatabase(process.env.TEST_DATABASE_URL||'postgresql://dayly_app@127.0.0.1:55432/dayly_test');const app=buildApp(db);
 const payload={companyName:'Harbor Workshop',name:'Ada Okeke',email:`${randomUUID()}@example.test`,password:'local-test-only-passphrase'};
 try{const signup=await app.inject({method:'POST',url:'/api/auth/signup-admin',payload});assert.equal(signup.statusCode,200);const cookie=String(signup.headers['set-cookie']).split(';')[0];assert.match(String(signup.headers['set-cookie']),/HttpOnly/);assert.match(String(signup.headers['set-cookie']),/SameSite=Lax/);
 assert.equal((await app.inject({method:'POST',url:'/api/auth/signup-admin',payload})).statusCode,400);
 assert.equal((await app.inject({method:'POST',url:'/api/auth/login',payload:{login:payload.email,password:'wrong-password'}})).statusCode,401);
 const me=(await app.inject({url:'/api/me',headers:{cookie}})).json();assert.equal(me.role,'admin');
 const invite=(await app.inject({method:'POST',url:'/api/invites',headers:{cookie},payload:{maxUses:1}})).json();
 const join={code:invite.code.toLowerCase(),name:'Bola Ade',username:'bola',password:'local-test-only-passphrase'};const joined=await app.inject({method:'POST',url:'/api/auth/join',payload:join});assert.equal(joined.statusCode,200);
 assert.equal((await app.inject({method:'POST',url:'/api/auth/join',payload:{...join,username:'other'}})).statusCode,400);
 const expired=(await app.inject({method:'POST',url:'/api/invites',headers:{cookie},payload:{}})).json();const company=await db.pool.query('SELECT id FROM companies WHERE code=$1',[me.companyCode]);await db.withTenant(company.rows[0].id,tx=>tx.execute(sql`UPDATE invites SET expires_at=now()-interval '1 day' WHERE id=${expired.id}`));assert.equal((await app.inject({method:'POST',url:'/api/auth/join',payload:{...join,code:expired.code}})).statusCode,400);
 const second=await app.inject({method:'POST',url:'/api/auth/signup-admin',payload:{...payload,email:`${randomUUID()}@example.test`}});const secondCookie=String(second.headers['set-cookie']).split(';')[0];assert.deepEqual((await app.inject({url:'/api/invites',headers:{cookie:secondCookie}})).json(),[]);
 }finally{await app.close();await db.pool.end();}
});
