import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import nunjucks from 'nunjucks';
import { pool } from './db/pool.js';
import { env } from './config/env.js';
import { populateUser } from './middleware/auth.js';
import { errorHandler } from './middleware/errorHandler.js';
import { authRouter } from './routes/auth.js';
import { homeRouter } from './routes/home.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createApp(): express.Application {
  const app = express();

  // Nunjucks template engine
  const viewsPath = path.join(__dirname, 'views');
  const nunjucksEnv = nunjucks.configure(viewsPath, {
    autoescape: true,
    express: app,
    noCache: env.NODE_ENV !== 'production',
  });

  // Global template filters
  nunjucksEnv.addFilter('capitalize', (str: string) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  });

  app.set('view engine', 'njk');

  // Static assets
  const publicPath = path.join(__dirname, '..', 'public');
  app.use(express.static(publicPath));

  // Body parsers
  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());

  // Session configuration
  const PgSessionStore = connectPgSimple(session);
  const sessionStore = new PgSessionStore({
    pool,
    tableName: 'session',
    createTableIfMissing: false, // Created via our plain SQL migration
  });

  app.use(
    session({
      store: sessionStore,
      secret: env.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        sameSite: 'lax',
        secure: env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      },
    })
  );

  // User population & flash messages
  app.use(populateUser);

  // Mount routes
  app.use('/auth', authRouter);
  app.use('/', homeRouter);

  // 404 handler
  app.use((req, res) => {
    res.status(404);
    if (req.accepts('html')) {
      res.render('pages/error.njk', {
        pageTitle: '404 Not Found - Workshop House',
        statusCode: 404,
        title: 'Page Not Found',
        message: 'The page you requested could not be found.',
      });
      return;
    }
    res.json({ error: 'Not found', statusCode: 404 });
  });

  // Global error handler
  app.use(errorHandler);

  return app;
}

export const app = createApp();
