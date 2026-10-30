import app from './app';
import { env } from './config/env';
import { startOrderExpiryJob } from './services/orderExpiry.job';
import { startNewsletterJob } from './services/newsletter.job';

app.listen(env.PORT, () => {
  console.log(`Backend server is running on http://localhost:${env.PORT}`);
  console.log(`Environment: ${env.NODE_ENV}`);

  // Iniciar cron jobs
  startOrderExpiryJob();
  startNewsletterJob();
});

