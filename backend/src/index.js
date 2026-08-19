import 'dotenv/config';
import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import contentRoutes from './routes/content.js';
import practiceRoutes from './routes/practice.js';
import aiRoutes from './routes/ai.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const publicPath = path.join(__dirname, '..', 'public');

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// API Routes FIRST
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api', authRoutes);
app.use('/api', contentRoutes);
app.use('/api', practiceRoutes);
app.use('/api', aiRoutes);

// Static + SPA fallback — use middleware (not get('/*')) for Express 5 compat
app.use((req, res, next) => {
  // Skip API routes
  if (req.path.startsWith('/api')) return next();

  const urlPath = req.path === '/' ? '/index.html' : req.path;
  let filePath = path.join(publicPath, urlPath);

  if (!fs.existsSync(filePath)) {
    filePath = path.join(publicPath, 'index.html');
  }

  const ext = path.extname(filePath).toLowerCase();
  const mime = { '.html':'text/html','.js':'application/javascript','.css':'text/css','.svg':'image/svg+xml','.ico':'image/x-icon','.png':'image/png','.json':'application/json' };
  res.setHeader('Content-Type', mime[ext] || 'text/plain');
  fs.readFile(filePath, (err, data) => {
    if (err) return res.status(404).json({ message: 'Not found' });
    res.end(data);
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
