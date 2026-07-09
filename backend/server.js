import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config, missingConfig } from './src/config.js';
import { errorHandler, notFound } from './src/middleware/errors.js';

const app = express();
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: config.frontendUrl.split(',').map((value) => value.trim()) }));
app.use(express.json({ limit: '1mb' }));
app.use(morgan(config.nodeEnv === 'production' ? 'combined' : 'dev'));

let pool;
if (missingConfig.length) {
  console.error(`Backend configuration incomplete. Missing: ${missingConfig.join(', ')}`);
  app.use('/api', (_req, res) => res.status(503).json({
    error: `Backend configuration incomplete. Set these values in backend/.env: ${missingConfig.join(', ')}`
  }));
} else {
  ({ pool } = await import('./src/db.js'));
  const { default: recipeRoutes } = await import('./src/routes/recipes.js');
  app.get('/api/health', async (_req, res, next) => {
    try { await pool.query('SELECT 1'); res.json({ status: 'ok' }); } catch (error) { next(error); }
  });
  app.use('/api/recipes', recipeRoutes);
}
app.use(notFound);
app.use(errorHandler);

const server = app.listen(config.port, () => console.log(`API listening on port ${config.port}`));
async function shutdown() { server.close(async () => { if (pool) await pool.end(); process.exit(0); }); }
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
