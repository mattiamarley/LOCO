import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createApp} from '../dev.mjs';
import {Store} from '../store.mjs';

test('account isolation, persisted paths, ordering and review transactions',async t=>{
 const directory=mkdtempSync(join(tmpdir(),'loco-api-')),path=join(directory,'test.sqlite');const {server,store}=createApp(path);await new Promise(r=>server.listen(0,'127.0.0.1',r));t.after(()=>{server.close();store.db.close();rmSync(directory,{recursive:true,force:true})});const origin='http://127.0.0.1:'+server.address().port;
 async function req(endpoint,method='GET',body,cookie=''){const r=await fetch(origin+endpoint,{method,headers:{'Content-Type':'application/json','X-Loco-Request':'1',Cookie:cookie},...(body?{body:JSON.stringify(body)}:{})});return {status:r.status,cookie:r.headers.get('set-cookie')?.split(';')[0],data:r.headers.get('content-type')?.includes('json')?await r.json():await r.text()}}
 assert.equal((await req('/')).status,200);assert.equal((await req('/api/routes')).status,401);
 const a=await req('/api/register','POST',{email:'one@example.com',password:'test-only-password',name:'One'}),b=await req('/api/register','POST',{email:'two@example.com',password:'test-only-password',name:'Two'});assert.equal(a.status,200);assert.ok(a.cookie);assert.equal((await req('/api/me','GET',null,a.cookie)).data.name,'One');
 const r=await req('/api/routes','POST',{title:'La stanza'},a.cookie);assert.equal(r.status,201);const id=r.data.id;assert.equal((await req('/api/routes/'+id,'GET',null,b.cookie)).status,404);
 const first=await req(`/api/routes/${id}/loci`,'POST',{label:'Porta',question:'Quale frutto?',answer:'Mela',scene:'Una mela blocca la porta'},a.cookie);const second=await req(`/api/routes/${id}/loci`,'POST',{label:'Letto',question:'Quale mezzo?',answer:'Nave'},a.cookie);
 assert.equal(first.status,201);assert.equal((await req(`/api/loci/${first.data.id}/review`,'POST',{outcome:'correct'},b.cookie)).status,404);
 const rated=await req(`/api/loci/${first.data.id}/review`,'POST',{outcome:'correct'},a.cookie);assert.equal(rated.data.streak,1);assert.ok(rated.data.due>Date.now());assert.equal((await req('/api/summary','GET',null,a.cookie)).data.reviews,1);
 const reordered=await req(`/api/routes/${id}/order`,'PUT',{ids:[second.data.id,first.data.id]},a.cookie);assert.equal(reordered.data.loci[0].label,'Letto');assert.equal((await req(`/api/routes/${id}/order`,'PUT',{ids:[first.data.id,first.data.id]},a.cookie)).status,400);
 const changed=await req(`/api/routes/${id}/loci/${first.data.id}`,'PUT',{label:'Porta',question:'Quale frutto?',answer:'Pera'},a.cookie);assert.equal(changed.data.streak,0);assert.equal(changed.data.studied,0);
 assert.equal((await req(`/api/routes/${id}/loci`,'POST',{label:'Bad',question:'?',answer:'a',x:2},a.cookie)).status,400);
 assert.equal((await req('/api/lessons/2','PUT',{completed:true},a.cookie)).status,200);assert.deepEqual((await req('/api/summary','GET',null,b.cookie)).data.completed,[]);
 const reopened=new Store(path);assert.equal(reopened.routes(a.data.id)[0].title,'La stanza');reopened.db.close();
 const foreign=await fetch(origin+'/api/routes',{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://evil.example',Cookie:a.cookie,'X-Loco-Request':'1'},body:'{}'});assert.equal(foreign.status,403);
 assert.equal((await req('/api/logout','POST',{},a.cookie)).status,200);assert.equal((await req('/api/me','GET',null,a.cookie)).status,401);
});
