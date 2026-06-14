import '@/lib/env';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@/db/schema';

const connectionString = process.env.DATABASE_URL!;

const client = postgres(connectionString, {
  max: 1,
  ssl: 'require',
});

export const db = drizzle(client, { schema });
