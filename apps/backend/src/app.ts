import express from 'express';
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
import settingsRouter from './routes/settings';
import cartRouter from './routes/cart';
import offersRouter from './routes/offers';
import adminOffersRouter from './routes/admin/offers';
import { errorHandler } from './middleware/errorHandler';

const app = express();

app.set('trust proxy', 1);

app.use(
  cors({
    origin: env.CORS_ORIGIN,
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
app.use('/api/products', productsRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/brands', brandsRouter);
app.use('/api/offers', offersRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/cart', cartRouter);
app.use('/api/admin/products', adminProductsRouter);
app.use('/api/admin/offers', adminOffersRouter);
app.use('/api/admin/settings', adminSettingsRouter);
app.use('/api/admin/sync-logs', adminSyncLogsRouter);
app.use('/api/sync/products', syncProductsRouter);
app.use('/api/sync/images', syncImagesRouter);

// Global Error Handler
app.use(errorHandler);

export default app;
