import app from './app';
import { env } from './config/env';
import { prisma } from '@papes-confort/database';
import { startOrderExpiryJob } from './services/orderExpiry.job';
import { startNewsletterJob } from './services/newsletter.job';

const server = app.listen(env.PORT, () => {
  console.log(`Backend server is running on http://localhost:${env.PORT}`);
  console.log(`Environment: ${env.NODE_ENV}`);

  // Iniciar cron jobs
  startOrderExpiryJob();
  startNewsletterJob();
});

async function gracefulShutdown(signal: string) {
  console.log(`[shutdown] Recibida señal ${signal}. Cerrando conexiones...`);
  server.close(async () => {
    try {
      await prisma.$disconnect();
    } catch (err) {
      console.error('[shutdown] Error al desconectar Prisma:', err);
    } finally {
      process.exit(0);
    }
  });
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

