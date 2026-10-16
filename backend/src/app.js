import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import { env } from './config/env.js';
import routes from './routes/index.js';
import { apiLimiter } from './middlewares/rateLimiters.js';
import { sanitizeInput } from './middlewares/sanitize.js';
import { errorHandler, notFound } from './middlewares/errorHandler.js';

const app = express();

// Required for correct client IPs (rate limiting) behind Render / Railway / Nginx
app.set('trust proxy', 1);
app.disable('x-powered-by');

app.use(
  helmet({
    // Images are served by Cloudinary and the API is consumed cross-origin
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

app.use(
  cors({
    origin(origin, cb) {
      // Allow same-origin / server-to-server requests (no Origin header) and configured clients
      if (!origin || env.clientUrls.includes(origin)) return cb(null, true);
      return cb(new Error(`Origin ${origin} is not allowed by CORS`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  })
);

app.use(compression());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(sanitizeInput);
app.use('/api', apiLimiter);

app.use('/api', routes);
app.get('/sitemap.xml', (req, _res, next) => {
  req.url = '/sitemap.xml';
  routes(req, _res, next);
});
app.get('/', (_req, res) => res.json({ name: 'MORAQQA API', status: 'ok' }));

app.use(notFound);
app.use(errorHandler);

export default app;
