import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Please provide your Supabase database URL.",
  );
}

// Create postgres connection for Supabase
const client = postgres(process.env.DATABASE_URL);
export const db = drizzle(client, { schema });