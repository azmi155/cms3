import { Kysely, SqliteDialect } from 'kysely';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { Database as DatabaseSchema } from './schema.js';

const dataDirectory = process.env.DATA_DIRECTORY || './data';
const dbPath = path.join(dataDirectory, 'database.sqlite');

console.log('🗄️  Database configuration:');
console.log(`   Data directory: ${dataDirectory}`);
console.log(`   Database path: ${dbPath}`);

// Ensure data directory exists
try {
  if (!fs.existsSync(dataDirectory)) {
    fs.mkdirSync(dataDirectory, { recursive: true });
    console.log(`✅ Created data directory: ${dataDirectory}`);
  }
} catch (error) {
  console.error('❌ Failed to create data directory:', error);
  throw error;
}

// Initialize SQLite database
let sqliteDb;
try {
  sqliteDb = new Database(dbPath);
  
  // Enable foreign keys
  sqliteDb.pragma('foreign_keys = ON');
  
  // Set reasonable timeout and other pragmas
  sqliteDb.pragma('busy_timeout = 10000');
  sqliteDb.pragma('journal_mode = WAL');
  sqliteDb.pragma('synchronous = NORMAL');
  
  console.log('✅ SQLite database initialized successfully');
} catch (error) {
  console.error('❌ Failed to initialize SQLite database:', error);
  throw error;
}

// Create Kysely instance with enhanced logging
export const db = new Kysely<DatabaseSchema>({
  dialect: new SqliteDialect({
    database: sqliteDb,
  }),
  log: (event) => {
    if (event.level === 'query') {
      console.log(`🔍 SQL Query: ${event.query.sql}`);
      if (event.query.parameters && event.query.parameters.length > 0) {
        console.log(`📋 Parameters:`, event.query.parameters);
      }
    }
    if (event.level === 'error') {
      console.error('❌ SQL Error:', event.error);
      console.error('🔍 Failed Query:', event.query.sql);
    }
  }
});

// Test database connection
try {
  const testQuery = db.selectFrom('sqlite_master').select('name').limit(1);
  const result = testQuery.execute();
  console.log('✅ Database connection test successful');
} catch (error) {
  console.error('❌ Database connection test failed:', error);
  throw error;
}

// Handle process cleanup
process.on('beforeExit', () => {
  try {
    if (sqliteDb) {
      sqliteDb.close();
      console.log('✅ Database connection closed');
    }
  } catch (error) {
    console.error('❌ Error closing database:', error);
  }
});

process.on('SIGTERM', () => {
  try {
    if (sqliteDb) {
      sqliteDb.close();
      console.log('✅ Database connection closed (SIGTERM)');
    }
  } catch (error) {
    console.error('❌ Error closing database (SIGTERM):', error);
  }
});
