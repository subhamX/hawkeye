import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema';


const databaseUrl = process.env.DATABASE_URL!;

if(!databaseUrl) {
    throw new Error('DATABASE_URL is not set');
}

export const drizzleDb = drizzle(databaseUrl, {schema});
