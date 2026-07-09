import { CognitoJwtVerifier } from 'aws-jwt-verify';
import { config } from '../config.js';
import { pool } from '../db.js';

const verifier = CognitoJwtVerifier.create({
  userPoolId: config.userPoolId,
  tokenUse: 'access',
  clientId: config.clientId
});

export async function requireAuth(req, res, next) {
  try {
    const [scheme, token] = (req.headers.authorization || '').split(' ');
    if (scheme !== 'Bearer' || !token) return res.status(401).json({ error: 'A Bearer access token is required' });

    const claims = await verifier.verify(token);
    req.user = { id: claims.sub, username: claims.preferred_username || claims.username || claims.sub };

    // Access tokens do not reliably contain email. The client supplies it once;
    // subsequent calls retain the existing RDS value.
    const email = req.headers['x-user-email'];
    if (email) {
      await pool.query(
        `INSERT INTO users (user_id, username, email) VALUES ($1, $2, $3)
         ON CONFLICT (user_id) DO UPDATE SET username = EXCLUDED.username, email = EXCLUDED.email`,
        [req.user.id, req.user.username, email]
      );
    }
    next();
  } catch (error) {
    console.error('Authentication failed:', error.message);
    res.status(401).json({ error: 'Invalid or expired access token' });
  }
}
