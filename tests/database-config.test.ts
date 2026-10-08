import {test} from 'node:test';
import assert from 'node:assert/strict';
import {validateDatabaseURL} from '../lib/database-config';
import {publicError} from '../lib/public-errors';
test('rejects truncated connection strings and password placeholders before DNS lookup',()=>{
 for(const url of ['postgresql://postgres.projectref','postgresql://postgres.projectref:YOUR-PASSWORD@aws-0-us-east-1.pooler.supabase.com:6543/postgres'])assert.throws(()=>validateDatabaseURL(url),/not configured correctly/);
 const url='postgresql://postgres.projectref:secret@aws-0-us-east-1.pooler.supabase.com:6543/postgres';assert.equal(validateDatabaseURL(url),url);
});
test('network and database errors do not expose hostnames or credentials to the UI',()=>{
 const error=Object.assign(new Error('getaddrinfo ENOTFOUND postgres.private-project'),{code:'ENOTFOUND'});
 const result=publicError(error);assert.equal(result.status,503);assert.ok(!result.message.includes('private-project'));assert.ok(!result.message.includes('getaddrinfo'));
});
