'use strict';
require('dotenv').config();
const express = require('express');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { Pool } = require('pg');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3000;
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('Missing DATABASE_URL. Copy .env.example to .env and configure PostgreSQL.');
  process.exit(1);
}
if (!process.env.ADMIN_TOKEN || process.env.ADMIN_TOKEN.length < 24) {
  console.error('Set ADMIN_TOKEN to a long random secret (at least 24 characters).');
  process.exit(1);
}
const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: process.env.DATABASE_SSL === 'false' ? false : { rejectUnauthorized: false },
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000
});

app.disable('x-powered-by');
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: '20kb' }));
app.use(express.urlencoded({ extended: false, limit: '20kb' }));
app.use(express.static(path.join(__dirname, 'public'), { index: false, maxAge: '1h', dotfiles: 'deny' }));

const registrationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many attempts. Please wait and try again.' }
});

async function initDb() {
  await pool.query(`CREATE TABLE IF NOT EXISTS registrations (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    contact VARCHAR(180) NOT NULL,
    interest VARCHAR(120) NOT NULL,
    message VARCHAR(2000) NOT NULL DEFAULT '',
    status VARCHAR(20) NOT NULL DEFAULT 'new',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`);
}

function cleanText(value, max) {
  return typeof value === 'string' ? value.trim().replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').slice(0, max) : '';
}
function requireAdmin(req, res, next) {
  const auth = req.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!token || token.length !== process.env.ADMIN_TOKEN.length || token !== process.env.ADMIN_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

app.get('/api/health', async (_req, res) => {
  try { await pool.query('SELECT 1'); res.json({ ok: true, database: 'connected' }); }
  catch (_e) { res.status(503).json({ ok: false, database: 'unavailable' }); }
});

app.post('/api/registrations', registrationLimiter, async (req, res) => {
  const name = cleanText(req.body.name, 120);
  const contact = cleanText(req.body.email, 180);
  const interest = cleanText(req.body.interest, 120);
  const message = cleanText(req.body.message, 2000);
  if (!name || !contact || !interest) return res.status(400).json({ error: 'Please complete all required fields.' });
  if (name.length < 2 || contact.length < 4) return res.status(400).json({ error: 'Please check your name and contact details.' });
  try {
    const result = await pool.query(
      'INSERT INTO registrations (name, contact, interest, message) VALUES ($1, $2, $3, $4) RETURNING id, created_at',
      [name, contact, interest, message]
    );
    const registration = result.rows[0];
    // Email notification is optional; saved database submissions remain available if SMTP is not configured.
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      try {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT || 465),
          secure: String(process.env.SMTP_SECURE || 'true') === 'true',
          auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        });
        await transporter.sendMail({
          from: process.env.MAIL_FROM || process.env.SMTP_USER,
          to: process.env.NOTIFY_EMAIL || 'mindacademy540@gmail.com',
          subject: `MIND Academy — New registration #${registration.id}`,
          text: `New registration received\n\nName: ${name}\nContact: ${contact}\nInterest: ${interest}\nMessage: ${message || '(none)'}\nReceived: ${registration.created_at}`
        });
      } catch (mailError) { console.error('Email notification failed; registration is saved:', mailError.message); }
    }
    res.status(201).json({ ok: true, id: registration.id, message: 'Registration received.' });
  } catch (error) {
    console.error('Could not save registration:', error.message);
    res.status(500).json({ error: 'Could not save your request. Please try again later.' });
  }
});

app.get('/api/admin/registrations', requireAdmin, async (req, res) => {
  const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 100, 1), 200);
  try {
    const result = await pool.query(
      'SELECT id, name, contact, interest, message, status, created_at FROM registrations ORDER BY created_at DESC LIMIT $1',
      [limit]
    );
    res.set('Cache-Control', 'no-store').json({ registrations: result.rows });
  } catch (error) {
    console.error('Could not load registrations:', error.message);
    res.status(500).json({ error: 'Could not load registrations.' });
  }
});

app.patch('/api/admin/registrations/:id', requireAdmin, async (req, res) => {
  const id = Number.parseInt(req.params.id, 10);
  const status = cleanText(req.body.status, 20);
  if (!Number.isSafeInteger(id) || id < 1 || !['new', 'contacted', 'closed'].includes(status)) {
    return res.status(400).json({ error: 'Invalid registration ID or status.' });
  }
  try {
    const result = await pool.query('UPDATE registrations SET status = $1 WHERE id = $2 RETURNING id, status', [status, id]);
    if (!result.rowCount) return res.status(404).json({ error: 'Registration not found.' });
    res.json({ ok: true, registration: result.rows[0] });
  } catch (error) {
    console.error('Could not update registration:', error.message);
    res.status(500).json({ error: 'Could not update registration.' });
  }
});

app.get('/admin', (_req, res) => res.sendFile(path.join(__dirname, 'admin.html')));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'Not found' });
  res.sendFile(path.join(__dirname, 'public', 'index.html'), err => { if (err) next(err); });
});

initDb().then(() => {
  app.listen(PORT, () => console.log(`MIND Academy running on port ${PORT}`));
}).catch(error => {
  console.error('Database initialization failed:', error.message);
  process.exit(1);
});

process.on('SIGTERM', async () => { await pool.end(); process.exit(0); });
