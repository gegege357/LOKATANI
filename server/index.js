import express from 'express';
import cors from 'cors';
import db from './database.js';

const app = express();
const PORT = 3001;

// Middleware
app.use(cors()); // Mengizinkan React mengakses API
app.use(express.json());

// =======================
// ROUTES UNTUK MANAJEMEN USER
// =======================

// 1. GET /api/users - Ambil semua user dari SQL
app.get('/api/users', (req, res) => {
  db.all('SELECT * FROM users', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// 2. GET /api/users/:id - Ambil satu user by ID
app.get('/api/users/:id', (req, res) => {
  const sql = 'SELECT * FROM users WHERE id = ?';
  db.get(sql, [req.params.id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (row) {
      res.json(row);
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  });
});

// 3. POST /api/users - Tambah user baru (manual)
app.post('/api/users', (req, res) => {
  const { name, email, role = 'user', password } = req.body;
  const id = `user_${Date.now()}`;
  const createdAt = new Date().toISOString().split('T')[0];
  const lastLogin = 'Belum pernah';
  const status = 'active';

  const sql = 'INSERT INTO users (id, name, email, role, status, lastLogin, createdAt, password) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
  const params = [id, name, email, role, status, lastLogin, createdAt, password];

  db.run(sql, params, function (err) {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.json({ id, name, email, role, status, lastLogin, createdAt });
  });
});

// 4. PUT /api/users/:id - Perbarui data user
app.put('/api/users/:id', (req, res) => {
  const { name, role, status, lastLogin } = req.body;
  const id = req.params.id;

  // Build the SQL query dinamis
  const updates = [];
  const params = [];
  if (name) { updates.push('name = ?'); params.push(name); }
  if (role) { updates.push('role = ?'); params.push(role); }
  if (status) { updates.push('status = ?'); params.push(status); }
  if (lastLogin) { updates.push('lastLogin = ?'); params.push(lastLogin); }

  if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });

  const sql = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
  params.push(id);

  db.run(sql, params, function (err) {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.json({ message: 'User updated successfully', changes: this.changes });
  });
});

// 5. DELETE /api/users/:id - Hapus user
app.delete('/api/users/:id', (req, res) => {
  db.run('DELETE FROM users WHERE id = ?', req.params.id, function (err) {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.json({ message: 'deleted', changes: this.changes });
  });
});

// =======================
// ROUTES UNTUK AUTENTIKASI
// =======================

// POST /api/login (Manual Login)
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  const sql = 'SELECT * FROM users WHERE email = ? AND password = ?';
  db.get(sql, [email, password], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (row) {
      // Update last login
      const lastLogin = 'Baru saja';
      db.run('UPDATE users SET lastLogin = ? WHERE id = ?', [lastLogin, row.id]);
      res.json(row);
    } else {
      res.status(401).json({ error: 'Invalid email or password' });
    }
  });
});

// POST /api/login/google (Sinkronisasi Login Google)
app.post('/api/login/google', (req, res) => {
  const { email, name, sub, picture } = req.body; // sub = googleId
  
  // Cek apakah user sudah ada di SQL
  db.get('SELECT * FROM users WHERE googleId = ? OR email = ?', [sub, email], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }

    const lastLogin = 'Baru saja';

    if (row) {
      // Usah sudah ada, cuma update lastLogin
      const updateSql = 'UPDATE users SET lastLogin = ?, googleId = ? WHERE id = ?';
      db.run(updateSql, [lastLogin, sub, row.id], (updateErr) => {
        if (updateErr) console.error(updateErr);
      });
      res.json({ ...row, lastLogin, googleId: sub });
    } else {
      // User belum ada, masukkan sebagai user baru
      const id = sub;
      const role = 'user';
      const status = 'active';
      const createdAt = new Date().toISOString().split('T')[0];

      const insertSql = 'INSERT INTO users (id, name, email, role, avatar, googleId, status, lastLogin, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
      db.run(insertSql, [id, name, email, role, picture, sub, status, lastLogin, createdAt], function(insertErr) {
        if (insertErr) {
          res.status(500).json({ error: insertErr.message });
          return;
        }
        res.json({ id, name, email, role, avatar: picture, googleId: sub, status, lastLogin, createdAt });
      });
    }
  });
});

// Jalankan server
app.listen(PORT, () => {
  console.log(`Backend Server berjalan di http://localhost:${PORT}`);
});
