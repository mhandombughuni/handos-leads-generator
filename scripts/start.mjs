import { cpSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
// Preserve the project database path when Next's standalone server changes cwd.
const root=process.cwd();
for(const file of ['.env.local','.env'])if(existsSync(file))process.loadEnvFile(file);
const configured=process.env.DATABASE_URL||'file:./data/handos.sqlite';
if(configured.startsWith('file:')&&configured!=='file::memory:')process.env.DATABASE_URL=`file:${resolve(root,configured.slice(5))}`;
const standalone=resolve(root,'.next/standalone');
if(!existsSync(`${standalone}/server.js`))throw new Error('Run npm run build before npm start.');
cpSync(resolve(root,'.next/static'),`${standalone}/.next/static`,{recursive:true});
cpSync(resolve(root,'public'),`${standalone}/public`,{recursive:true});
process.env.PORT=process.env.PORT||'3000';
process.env.HOSTNAME=process.env.HOSTNAME||'0.0.0.0';
await import(`${standalone}/server.js`);
