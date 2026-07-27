import mysql from 'mysql2/promise';
import { config } from '../config';
import { logger } from '../utils/logger';

export const gescomPool = mysql.createPool({
  host: config.gescomDb.host,
  port: config.gescomDb.port,
  user: config.gescomDb.user,
  password: config.gescomDb.password,
  database: config.gescomDb.database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export async function testGescomConnection(): Promise<boolean> {
  try {
    const connection = await gescomPool.getConnection();
    logger.info('Successfully connected to GesCom MySQL Database');
    connection.release();
    return true;
  } catch (error: any) {
    logger.error('Failed to connect to GesCom MySQL Database', { error: error.message });
    return false;
  }
}
