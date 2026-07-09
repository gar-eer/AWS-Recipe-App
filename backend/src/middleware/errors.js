export function notFound(req, res) {
  res.status(404).json({ error: 'Route not found' });
}

export function errorHandler(error, req, res, next) {
  console.error(error);
  if (error.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ error: 'Image must be 5 MB or smaller' });
  if (error.code === '23503') return res.status(400).json({ error: 'Referenced record does not exist' });
  if (error.code === '23505') return res.status(409).json({ error: 'That record already exists' });
  res.status(error.status || 500).json({ error: error.expose ? error.message : 'Internal server error' });
}

