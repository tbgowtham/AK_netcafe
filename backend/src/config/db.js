import sqlite3 from 'sqlite3';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Database path
const dbDir = join(__dirname, '../../database');
const dbPath = join(dbDir, 'database.db');

// Ensure database directory exists
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Enable verbose mode for debugging
const sqlite = sqlite3.verbose();

// Open database connection
const db = new sqlite.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database at:', dbPath);
    initializeDatabase();
  }
});

function initializeDatabase() {
  const schemaPath = join(__dirname, '../../database/schema.sql');
  if (fs.existsSync(schemaPath)) {
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // We execute the schema statements to ensure tables and initial seed data exist
    db.exec(schema, (err) => {
      if (err) {
        console.error('Error initializing database schema:', err.message);
      } else {
        console.log('Database initialized successfully.');
      }
    });
  } else {
    console.warn('Schema file not found. Database might be empty.');
  }
}

export default db;
