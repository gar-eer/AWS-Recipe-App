import { Router } from 'express';
import multer from 'multer';
import { randomUUID } from 'node:crypto';
import { PutObjectCommand, S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { pool } from '../db.js';
import { config } from '../config.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
const s3 = new S3Client({ region: config.awsRegion });
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => cb(null, ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.mimetype))
});

const recipeSelect = `
  SELECT r.*, u.username, COALESCE(AVG(v.rating), 0)::float AS average_rating,
         COUNT(v.review_id)::int AS review_count
  FROM recipes r JOIN users u ON u.user_id = r.user_id
  LEFT JOIN reviews v ON v.recipe_id = r.recipe_id`;

router.get('/', async (req, res, next) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
    const offset = Math.max(Number(req.query.offset) || 0, 0);
    const { rows } = await pool.query(
      `${recipeSelect} GROUP BY r.recipe_id, u.username ORDER BY r.created_at DESC LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    res.json(rows);
  } catch (error) { next(error); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const recipe = await pool.query(`${recipeSelect} WHERE r.recipe_id = $1 GROUP BY r.recipe_id, u.username`, [req.params.id]);
    if (!recipe.rows[0]) return res.status(404).json({ error: 'Recipe not found' });
    const reviews = await pool.query(
      `SELECT v.review_id, v.rating, v.comment, v.created_at, v.user_id, u.username
       FROM reviews v JOIN users u ON u.user_id = v.user_id
       WHERE v.recipe_id = $1 ORDER BY v.created_at DESC`, [req.params.id]
    );
    res.json({ ...recipe.rows[0], reviews: reviews.rows });
  } catch (error) { next(error); }
});

router.post('/', requireAuth, upload.single('image'), async (req, res, next) => {
  let key;
  try {
    const { title, description = '', instructions } = req.body;
    let ingredients;
    try { ingredients = JSON.parse(req.body.ingredients); } catch { ingredients = null; }
    if (!title?.trim() || !instructions?.trim() || !Array.isArray(ingredients) || !ingredients.length) {
      return res.status(400).json({ error: 'Title, instructions, and a non-empty ingredients array are required' });
    }
    if (!req.file) return res.status(400).json({ error: 'A valid image file is required' });

    const extension = req.file.originalname.split('.').pop()?.replace(/[^a-zA-Z0-9]/g, '') || 'jpg';
    key = `recipes/${req.user.id}/${randomUUID()}.${extension}`;
    await s3.send(new PutObjectCommand({ Bucket: config.bucket, Key: key, Body: req.file.buffer, ContentType: req.file.mimetype }));
    const base = config.s3PublicBaseUrl || `https://${config.bucket}.s3.${config.awsRegion}.amazonaws.com`;
    const imageUrl = `${base}/${key.split('/').map(encodeURIComponent).join('/')}`;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const user = await client.query('SELECT 1 FROM users WHERE user_id = $1', [req.user.id]);
      if (!user.rowCount) throw Object.assign(new Error('User profile is not synchronized; sign out and sign in again'), { status: 409, expose: true });
      const result = await client.query(
        `INSERT INTO recipes (user_id, title, description, ingredients, instructions, image_url)
         VALUES ($1, $2, $3, $4::jsonb, $5, $6) RETURNING *`,
        [req.user.id, title.trim(), description.trim(), JSON.stringify(ingredients), instructions.trim(), imageUrl]
      );
      await client.query('COMMIT');
      res.status(201).json(result.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally { client.release(); }
  } catch (error) {
    if (key) s3.send(new DeleteObjectCommand({ Bucket: config.bucket, Key: key })).catch(console.error);
    next(error);
  }
});

router.post('/:id/reviews', requireAuth, async (req, res, next) => {
  try {
    const rating = Number(req.body.rating);
    const comment = String(req.body.comment || '').trim();
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) return res.status(400).json({ error: 'Rating must be an integer from 1 to 5' });
    const { rows } = await pool.query(
      `INSERT INTO reviews (recipe_id, user_id, rating, comment) VALUES ($1, $2, $3, $4)
       ON CONFLICT (recipe_id, user_id) DO UPDATE SET rating = EXCLUDED.rating, comment = EXCLUDED.comment, created_at = NOW()
       RETURNING *`, [req.params.id, req.user.id, rating, comment]
    );
    res.status(201).json(rows[0]);
  } catch (error) { next(error); }
});

export default router;

