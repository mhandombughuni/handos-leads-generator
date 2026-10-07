import { db, all } from '../lib/db';
db(); console.log(`Database ready: ${all('leads').length} fictional demo leads. Existing data is preserved.`);
