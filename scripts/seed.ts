import { db, all } from '../lib/db';
db();
async function main(){console.log(`Database ready: ${(await all('leads')).length} fictional demo leads. Existing data is preserved.`);

}
main().catch(()=>{console.error("Seeding failed");process.exitCode=1;});
