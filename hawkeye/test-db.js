import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL || 'postgresql://localhost:5432/hawkeye';

async function testConnection() {
  try {
    const client = postgres(connectionString);
    const db = drizzle(client);
    
    // Test basic query
    const result = await client`SELECT 1 as test`;
    console.log('Database connection successful:', result);
    
    // Test if user table exists
    const tables = await client`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('user', 'session', 'account', 'verificationToken')
    `;
    console.log('NextAuth tables found:', tables);
    
    await client.end();
  } catch (error) {
    console.error('Database connection failed:', error);
  }
}

testConnection();