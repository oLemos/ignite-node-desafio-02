import { knex as knexSetup, Knex } from 'knex'

import { env } from './env'

if (!env.DATABASE_URL) {
  throw new Error('No DATABASE_URL environment variable found.')
}

const databaseConnection =
  env.DATABASE_CLIENT === 'sqlite'
    ? { filename: env.DATABASE_URL }
    : env.DATABASE_URL

export const databaseConfig: Knex.Config = {
  client: env.DATABASE_CLIENT,
  connection: databaseConnection,
  useNullAsDefault: true,
  migrations: {
    extension: 'ts',
    directory: './db/migrations',
  },
}

export const knex = knexSetup(databaseConfig)
