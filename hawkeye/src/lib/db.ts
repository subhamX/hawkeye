import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../../drizzle-db/schema';

const connectionString = process.env.DATABASE_URL || 'postgresql://localhost:5432/hawkeye';

const client = postgres(connectionString);
export const db = drizzle(client, { schema });