import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve,extname,sep} from 'node:path';
import {Store,AppError,hash,text} from './store.mjs';
const root=resolve(fileURLToPath(new URL('../prototype/',import.meta.url)));
export function createApp(database){const store=new Store(database),attempts=new Map();
 const server=createServer(async(req,res)=>{const url=new URL(req.url,'http://localhost'),path=url.pathname,method=req.method;
 const json=(status,data)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(data))};
 try{
  if(path.startsWith('/api/')){
   if(!['GET','POST','PUT','DELETE'].includes(method))throw new AppError('Metodo non consentito.',405);
   if(method!=='GET'&&(req.headers['x-loco-request']!=='1'||(req.headers.origin&&new URL(req.headers.origin).host!==req.headers.host)))throw new AppError('Richiesta non consentita.',403);
   let data={};if(method!=='GET'){let size=0,body='';for await(const chunk of req){size+=chunk.length;if(size>1024*1024)throw new AppError('Richiesta troppo grande.',413);body+=chunk;}try{data=body?JSON.parse(body):{}}catch{throw new AppError('JSON non valido.')}if(!data||typeof data!=='object'||Array.isArray(data))throw new AppError('Richiesta non valida.');}
   if(path==='/api/health')return json(200,{ok:true,storage:'sqlite',version:1});
   const token=req.headers.cookie?.split(';').map(v=>v.trim()).find(v=>v.startsWith('loco_session='))?.slice(13);
   if(['/api/register','/api/login'].includes(path)&&method==='POST'){
    const key=req.socket.remoteAddress,now=Date.now();if(attempts.size>10000)attempts.clear();let entry=attempts.get(key);if(!entry||entry.until<now){entry={n:0,until:now+600000};attempts.set(key,entry)}if(++entry.n>20)throw new AppError('Troppi tentativi. Riprova fra dieci minuti.',429);
    const result=store.account(data,path==='/api/register');res.setHeader('Set-Cookie',`loco_session=${result.token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=604800`);return json(200,result.user);
   }
   const user=store.user(token);if(!user)throw new AppError('Accedi per continuare.',401);
   if(path==='/api/me'&&method==='GET')return json(200,user);
   if(path==='/api/logout'&&method==='POST'){store.run('DELETE FROM sessions WHERE token_hash=?',hash(token));res.setHeader('Set-Cookie','loco_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0');return json(200,{ok:true})}
   if(path==='/api/me'&&method==='PUT'){store.run('UPDATE users SET name=? WHERE id=?',text(data.name,'nome',80,true),user.id);return json(200,store.user(token))}
   if(path==='/api/summary'&&method==='GET')return json(200,store.summary(user.id));
   if(path==='/api/backup'&&method==='GET')return json(200,store.backup(user.id));
   if(path==='/api/routes'&&method==='GET')return json(200,store.routes(user.id));
   if(path==='/api/routes'&&method==='POST')return json(201,store.saveRoute(user.id,data));
   let m=path.match(/^\/api\/routes\/([^/]+)$/);
   if(m){if(method==='GET')return json(200,store.detail(user.id,m[1]));if(method==='PUT')return json(200,store.saveRoute(user.id,data,m[1]));if(method==='DELETE'){store.route(user.id,m[1]);store.run('DELETE FROM routes WHERE id=?',m[1]);return json(200,{ok:true})}}
   m=path.match(/^\/api\/routes\/([^/]+)\/order$/);if(m&&method==='PUT')return json(200,store.reorder(user.id,m[1],data.ids));
   m=path.match(/^\/api\/routes\/([^/]+)\/loci(?:\/([^/]+))?$/);
   if(m){if(method==='POST'&&!m[2])return json(201,store.saveLocus(user.id,m[1],data));if(method==='PUT'&&m[2])return json(200,store.saveLocus(user.id,m[1],data,m[2]));if(method==='DELETE'&&m[2]){store.route(user.id,m[1]);const result=store.run('DELETE FROM loci WHERE route_id=? AND id=?',m[1],m[2]);if(!result.changes)throw new AppError('Locus non trovato.',404);return json(200,{ok:true})}}
   m=path.match(/^\/api\/loci\/([^/]+)\/review$/);if(m&&method==='POST')return json(200,store.review(user.id,m[1],data.outcome));
   m=path.match(/^\/api\/lessons\/(\d+)$/);if(m&&method==='PUT'){const lesson=Number(m[1]);if(lesson>7)throw new AppError('Lezione non valida.');if(data.completed===true)store.run('INSERT OR IGNORE INTO lesson_progress VALUES(?,?,?)',user.id,lesson,Date.now());else if(data.completed===false)store.run('DELETE FROM lesson_progress WHERE user_id=? AND lesson=?',user.id,lesson);else throw new AppError('Stato non valido.');return json(200,{ok:true})}
   throw new AppError('Endpoint non trovato.',404);
  }
  if(!['GET','HEAD'].includes(method))throw new AppError('Metodo non consentito.',405);
  const file=resolve(root,'.'+decodeURIComponent(path==='/'?'/workspace.html':path));if(!file.startsWith(root+sep))throw new AppError('Non trovato.',404);
  const info=await stat(file);if(!info.isFile())throw new AppError('Non trovato.',404);
  const mime={'.html':'text/html; charset=utf-8','.mjs':'text/javascript','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.ttf':'font/ttf'}[extname(file)]||'application/octet-stream';res.writeHead(200,{'Content-Type':mime,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' blob:; connect-src 'self'; object-src 'none'; frame-ancestors 'none'"});res.end(method==='HEAD'?undefined:await readFile(file));
 }catch(e){json(e.status||(e.code==='ENOENT'?404:500),{error:e.status?e.message:e.code==='ENOENT'?'Non trovato.':'Errore interno del server.'});if(!e.status&&e.code!=='ENOENT')console.error(e.message)}
 });return {server,store};}
if(process.argv[1]===fileURLToPath(import.meta.url)){const port=Number(process.env.LOCO_PORT||8781),db=process.env.LOCO_DB||fileURLToPath(new URL('../runtime/loco.sqlite',import.meta.url));const {server}=createApp(db);server.listen(port,'127.0.0.1',()=>console.log(`LOCO con database: http://127.0.0.1:${port}`));}
