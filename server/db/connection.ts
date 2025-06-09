import { Kysely, SqliteDialect } from 'kysely';
import Database from 'better-sqlite3';
import path from 'path';
import { Database as DatabaseSchema } from './schema.js';

const dataDirectory = process.env.DATA_DIRECTORY || './data';
const dbPath = path.join(dataDirectory, 'database.sqlite');

console.log('Database path:', dbPath);

const sqliteDb = new Database(dbPath);

export const db = new Kysely<DatabaseSchema>({
  dialect: new SqliteDialect({
    database: sqliteDb,
  }),
  log: ['query', 'error']
});
