import { defineConfig } from 'drizzle-kit'
import { resolveDatabasePath } from './src/db/paths'

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './src/db/migrations',
  dialect: 'sqlite',
  dbCredentials: {
    url: resolveDatabasePath(),
  },
})
