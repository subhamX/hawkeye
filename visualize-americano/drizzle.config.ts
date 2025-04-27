import { defineConfig } from 'drizzle-kit';

export default defineConfig({
    out: './drizzle-db/autogen-migrations',
    schema: './drizzle-db/schema/index.ts',
    dialect: 'postgresql',
    dbCredentials: {
        url: process.env.DATABASE_URL!,
    },
});
