import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Menghubungkan ke file database SQLite (akan dibuat jika belum ada)
const dbPath = join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to SQLite database:', err.message);
  } else {
    console.log('Connected to the SQLite database.');
  }
});

// Membuat tabel awal jika belum ada
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      role TEXT DEFAULT 'user',
      avatar TEXT,
      googleId TEXT UNIQUE,
      status TEXT DEFAULT 'active',
      lastLogin TEXT,
      createdAt TEXT,
      password TEXT
    )
  `, (err) => {
    if (err) {
      console.error('Error creating table:', err.message);
    } else {
      console.log('Users table ready.');
      
      // Insert mock admin jika database kosong
      db.get('SELECT COUNT(*) as count FROM users', (err, row) => {
        if (!err && row.count === 0) {
          const stmt = db.prepare('INSERT INTO users (id, name, email, role, status, lastLogin, createdAt, password) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
          stmt.run('1', 'Admin', 'admin@hydroponics.id', 'admin', 'active', 'Baru saja', '2026-03-01', 'admin123');
          stmt.run('2', 'User 1', 'user@hydroponics.id', 'user', 'active', '2j lalu', '2026-03-05', 'user123');
          stmt.finalize();
          console.log('Inserted initial mock users into SQLite.');
        }
      });
    }
  });
});

export default db;
