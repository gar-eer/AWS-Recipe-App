import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';
import '../src/config.js';
import { pool } from '../src/db.js';

try {
  const here = dirname(fileURLToPath(import.meta.url));
  const sql = await readFile(resolve(here, '../../schema.sql'), 'utf8');
  await pool.query(sql);
  console.log('Database schema initialized.');
} finally { await pool.end(); }
