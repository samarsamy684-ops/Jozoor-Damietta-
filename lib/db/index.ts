import { Pool } from 'pg'
import { drizzle } from 'drizzle-orm/node-postgres'
import * as schema from './schema'

const globalForDb = globalThis as typeof globalThis & { postgresPool?: Pool }

const pool = globalForDb.postgresPool ?? new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
  idleTimeoutMillis: 30_000,
})

if (process.env.NODE_ENV !== 'production') globalForDb.postgresPool = pool

export const db = drizzle(pool, { schema })
export { pool }
