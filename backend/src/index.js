const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const multer = require('multer');
const swaggerUi = require('swagger-ui-express');
const swaggerJsDoc = require('swagger-jsdoc');
const http = require('http');
const { Server } = require('socket.io');
const { Pool } = require('pg');
const Redis = require('ioredis');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

const upload = multer({ dest: 'uploads/' });
const port = process.env.PORT || 4000;
const jwtSecret = process.env.JWT_SECRET || 'moye_secret';
const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://ai-service:8000';

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const redis = new Redis(process.env.REDIS_URL || 'redis://redis:6379');
redis.on('error', () => console.log('Redis non disponible, fonctionnement dégradé.'));

const swaggerSpec = swaggerJsDoc({
  definition: {
    openapi: '3.0.0',
    info: { title: 'MOYÉ API', version: '1.0.0' },
    servers: [{ url: 'http://localhost:4000' }]
  },
  apis: ['src/index.js']
});
app.use('/swagger', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Token manquant' });
  try {
    req.user = jwt.verify(token, jwtSecret);
    next();
  } catch {
    res.status(401).json({ message: 'Token invalide' });
  }
};

/** @swagger
 * /health:
 *  get:
 *    summary: Health check
 */
app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'api' }));

app.post('/auth/register', async (req, res) => {
  const { username, password } = req.body;
  const hash = await bcrypt.hash(password, 8);
  const q = await pool.query(
    'INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id, username, points, level',
    [username, hash]
  );
  res.status(201).json(q.rows[0]);
});

app.post('/auth/login', async (req, res) => {
  const { username, password } = req.body;
  const q = await pool.query('SELECT * FROM users WHERE username=$1', [username]);
  const user = q.rows[0];
  if (!user) return res.status(401).json({ message: 'Identifiants invalides' });
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ message: 'Identifiants invalides' });
  const token = jwt.sign({ userId: user.id, username: user.username }, jwtSecret, { expiresIn: '7d' });
  res.json({ token });
});

app.get('/ethnies', async (_req, res) => {
  const cacheKey = 'ethnies';
  const cached = await redis.get(cacheKey).catch(() => null);
  if (cached) return res.json(JSON.parse(cached));
  const q = await pool.query('SELECT * FROM ethnic_groups ORDER BY id');
  await redis.set(cacheKey, JSON.stringify(q.rows), 'EX', 60).catch(() => null);
  res.json(q.rows);
});

app.get('/ethnies/:id', async (req, res) => {
  const q = await pool.query('SELECT * FROM ethnic_groups WHERE id=$1', [req.params.id]);
  if (!q.rows.length) return res.status(404).json({ message: 'Introuvable' });
  res.json(q.rows[0]);
});

app.post('/ethnies', auth, async (req, res) => {
  const { name, history, culture, gastronomy } = req.body;
  const q = await pool.query(
    'INSERT INTO ethnic_groups (name, history, culture, gastronomy) VALUES ($1,$2,$3,$4) RETURNING *',
    [name, history, culture, gastronomy]
  );
  await redis.del('ethnies').catch(() => null);
  res.status(201).json(q.rows[0]);
});

app.put('/ethnies/:id', auth, async (req, res) => {
  const { name, history, culture, gastronomy } = req.body;
  const q = await pool.query(
    'UPDATE ethnic_groups SET name=$1, history=$2, culture=$3, gastronomy=$4 WHERE id=$5 RETURNING *',
    [name, history, culture, gastronomy, req.params.id]
  );
  await redis.del('ethnies').catch(() => null);
  res.json(q.rows[0]);
});

app.delete('/ethnies/:id', auth, async (req, res) => {
  await pool.query('DELETE FROM ethnic_groups WHERE id=$1', [req.params.id]);
  await redis.del('ethnies').catch(() => null);
  res.status(204).send();
});

app.post('/ethnies/:id/recognize-image', upload.single('image'), async (req, res) => {
  const formData = new FormData();
  const fs = require('fs');
  formData.append('file', new Blob([fs.readFileSync(req.file.path)]), req.file.originalname);
  const response = await fetch(`${aiServiceUrl}/recognize-image`, { method: 'POST', body: formData });
  const data = await response.json();
  res.json({ filename: req.file.filename, ...data });
});

app.post('/bridge/translate', async (req, res) => {
  const response = await fetch(`${aiServiceUrl}/translate`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(req.body)
  });
  res.json(await response.json());
});

app.get('/academy/profile', auth, async (req, res) => {
  const q = await pool.query('SELECT id, username, points, level, badges FROM users WHERE id=$1', [req.user.userId]);
  res.json(q.rows[0]);
});

app.post('/academy/quiz/submit', auth, async (req, res) => {
  const { score = 0 } = req.body;
  const points = score * 10;
  const levelInc = score >= 7 ? 1 : 0;
  const badge = score >= 9 ? 'Maître du patrimoine' : null;
  const q = await pool.query(
    "UPDATE users SET points = points + $1, level = level + $2, badges = CASE WHEN $3::text IS NULL THEN badges ELSE array_append(badges, $3::text) END WHERE id=$4 RETURNING id, username, points, level, badges",
    [points, levelInc, badge, req.user.userId]
  );
  res.json(q.rows[0]);
});

app.post('/podcast/upload', auth, upload.single('audio'), (req, res) => {
  res.json({ message: 'Audio uploadé', streamUrl: `/uploads/${req.file.filename}` });
});

io.on('connection', (socket) => {
  socket.on('chat:message', async (payload) => {
    const response = await fetch(`${aiServiceUrl}/translate-inline`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
    });
    const translated = await response.json();
    io.emit('chat:message', { ...payload, translated: translated.translated_text, at: new Date().toISOString() });
  });
});

server.listen(port, () => console.log(`API MOYÉ démarrée sur ${port}`));
