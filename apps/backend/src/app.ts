import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import passport from './config/passport';
import healthRouter from './routes/health';
import authRouter from './routes/auth';
import productsRouter from './routes/products';
import categoriesRouter from './routes/categories';
import brandsRouter from './routes/brands';
import adminProductsRouter from './routes/admin/products';
import adminSettingsRouter from './routes/admin/settings';
import adminSyncLogsRouter from './routes/admin/sync-logs';
import syncProductsRouter from './routes/sync/products';
import syncImagesRouter from './routes/sync/images';
import syncOffersRouter from './routes/sync/offers';
import settingsRouter from './routes/settings';
import cartRouter from './routes/cart';
import offersRouter from './routes/offers';
import adminOffersRouter from './routes/admin/offers';
import customerAuthRouter from './routes/customer-auth';
import customerAccountRouter from './routes/customer-account';
import ordersRouter from './routes/orders';
import webhooksRouter from './routes/webhooks';
import adminOrdersRouter from './routes/admin/orders';
import bankPromotionsRouter from './routes/bankPromotions';
import adminBankPromotionsRouter from './routes/admin/bankPromotions';
import adminNewsletterRouter from './routes/admin/newsletter';
import { errorHandler } from './middleware/errorHandler';

const app = express();

app.set('trust proxy', 1);

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

const defaultAllowedOrigins = [
  'https://www.papesconfort.com.ar',
  'https://papesconfort.com.ar',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3000',
];

const customOrigins = (env.CORS_ORIGIN || '')
  .split(',')
  .map((o) => o.trim().replace(/\/$/, ''))
  .filter(Boolean);

const allowedOrigins = Array.from(new Set([...defaultAllowedOrigins, ...customOrigins]));

app.use(
  cors({
    origin: (origin, callback) => {
      // Peticiones sin origin (como apps móviles, llamadas servidor a servidor o curl)
      if (!origin) return callback(null, true);

      const cleanOrigin = origin.trim().replace(/\/$/, '');

      if (allowedOrigins.includes(cleanOrigin)) {
        return callback(null, true);
      }

      // Permitir cualquier subdominio de papesconfort.com.ar o deploys preview de Vercel
      if (
        /^https:\/\/([a-z0-9-]+\.)*papesconfort\.com\.ar$/.test(cleanOrigin) ||
        /^https:\/\/.*\.vercel\.app$/.test(cleanOrigin)
      ) {
        return callback(null, true);
      }

      return callback(null, false);
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cookieParser());
app.use(passport.initialize());

// Routes
app.use('/api/health', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/customer/auth', customerAuthRouter);
app.use('/api/customer/account', customerAccountRouter);
app.use('/api/products', productsRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/brands', brandsRouter);
app.use('/api/offers', offersRouter);
app.use('/api/bank-promotions', bankPromotionsRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/cart', cartRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/webhooks', webhooksRouter);
app.use('/api/admin/orders', adminOrdersRouter);
app.use('/api/admin/products', adminProductsRouter);
app.use('/api/admin/offers', adminOffersRouter);
app.use('/api/admin/bank-promotions', adminBankPromotionsRouter);
app.use('/api/admin/newsletter', adminNewsletterRouter);
app.use('/api/admin/settings', adminSettingsRouter);
app.use('/api/admin/sync-logs', adminSyncLogsRouter);
app.use('/api/sync/products', syncProductsRouter);
app.use('/api/sync/images', syncImagesRouter);
app.use('/api/sync/offers', syncOffersRouter);

// Global Error Handler
app.use(errorHandler);

export default app;
