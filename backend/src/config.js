import 'dotenv/config';

const required = ['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD', 'AWS_REGION', 'S3_BUCKET_NAME', 'COGNITO_USER_POOL_ID', 'COGNITO_CLIENT_ID'];
export const missingConfig = required.filter((key) => !process.env[key]);

export const config = {
  port: Number(process.env.PORT || 5000),
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  awsRegion: process.env.AWS_REGION,
  bucket: process.env.S3_BUCKET_NAME,
  s3PublicBaseUrl: process.env.S3_PUBLIC_BASE_URL?.replace(/\/$/, ''),
  userPoolId: process.env.COGNITO_USER_POOL_ID,
  clientId: process.env.COGNITO_CLIENT_ID
};
