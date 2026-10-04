import { registerAs } from '@nestjs/config';

export const databaseConfig = registerAs('database', () => ({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
  username: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres_secret',
  database: process.env.POSTGRES_DB || 'bantlik_db',
  synchronize: process.env.NODE_ENV !== 'production', // devda schema auto-sync
  logging: process.env.NODE_ENV === 'development',
}));
