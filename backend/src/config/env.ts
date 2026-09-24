import dotenv from 'dotenv';
dotenv.config();

export const ENV = {
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 4000,
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres@localhost:5433/campus_resolve?schema=public',
  JWT_SECRET: process.env.JWT_SECRET || 'campus-resolve-super-secret-jwt-key-2026',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  NODE_ENV: process.env.NODE_ENV || 'development'
};
