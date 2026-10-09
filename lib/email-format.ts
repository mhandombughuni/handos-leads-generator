import { z } from 'zod';
const schema=z.string().trim().email().max(254);
export function validEmail(value:unknown):value is string{return typeof value==='string'&&schema.safeParse(value).success;}
