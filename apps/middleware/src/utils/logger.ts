import winston from 'winston';
import path from 'path';

const logFormat = winston.format.printf((info: any) => {
  const { level, message, timestamp, ...metadata } = info;
  let msg = `[${timestamp}] [${String(level).toUpperCase()}]: ${message}`;
  if (Object.keys(metadata).length > 0) {
    msg += ` ${JSON.stringify(metadata)}`;
  }
  return msg;
});

export const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    logFormat
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        logFormat
      ),
    }),
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/middleware-error.log'),
      level: 'error',
    }),
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/middleware-combined.log'),
    }),
  ],
});
