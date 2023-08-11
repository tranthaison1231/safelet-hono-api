import dotenv from 'dotenv';

dotenv.config();

export const MAIL_TRANSPORT = process.env.MAIL_TRANSPORT;
export const MONGO_URI = process.env.MONGO_URI;
export const JWT_SECRET = process.env.JWT_SECRET;
export const CLIENT_URL = process.env.CLIENT_URL;
export const PORT = process.env.PORT || 3000;
export const MAIL_FROM = process.env.MAIL_FROM;
export const REDIS_HOST = process.env.REDIS_HOST;
export const REDIS_PORT = +process.env.REDIS_PORT || 6379;
export const REDIS_PASSWORD = process.env.REDIS_PASSWORD;
export const AWS_REGION = process.env.AWS_REGION;
export const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
export const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;
export const AWS_BUCKET_NAME = process.env.AWS_BUCKET_NAME;
