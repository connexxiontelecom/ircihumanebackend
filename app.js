const dotenv = require('dotenv');
dotenv.config();
console.log('[startup] Loading irc-api app.js');

const express = require('express');
const cors = require('cors');
const fileUpload = require('express-fileupload');
const { registerRoutes } = require('./routes');

if (process.env.DD_TRACE_ENABLED === 'true') {
  require('dd-trace').init();
}

if (process.env.STATSD_ENABLED === 'true') {
  try {
    const StatsD = require('hot-shots');
    const dogstatsd = new StatsD();
    dogstatsd.increment('page.views');
  } catch (statsErr) {
    console.warn('[startup] StatsD unavailable:', statsErr.message);
  }
}

const defaultProductionOrigins = [
  'https://ircng.org',
  'https://www.ircng.org',
];

const envOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowedOrigins = [...new Set([...defaultProductionOrigins, ...envOrigins])];

if (process.env.NODE_ENV !== 'production') {
  [
    'http://localhost:8080',
    'http://127.0.0.1:8080',
    'http://localhost:8081',
    'http://127.0.0.1:8081',
  ].forEach((origin) => {
    if (!allowedOrigins.includes(origin)) {
      allowedOrigins.push(origin);
    }
  });
}

const allowedCorsHeaders = [
  'Content-Type',
  'Authorization',
  'X-Requested-With',
  'x-auth-token',
];

function applyCorsHeaders(req, res, next) {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Vary', 'Origin');
  }
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', allowedCorsHeaders.join(', '));
    return res.sendStatus(204);
  }
  next();
}

const corsOptions = {
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: allowedCorsHeaders
};

function shouldEnableCronJobs() {
  if (process.env.ENABLE_CRON_JOBS === 'false') {
    return false;
  }

  return process.env.NODE_ENV !== 'test';
}

function registerErrorHandler(app) {
  app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    console.error(err.message, err.stack);
    return res.status(statusCode).json({ message: err.message });
  });
}

function configureCronJobs() {
  if (shouldEnableCronJobs()) {
    require('./jobs/scheduledCronJobs').startCronJobs();
  } else {
    console.log('[startup] Cron jobs disabled (ENABLE_CRON_JOBS is not true)');
  }
}

const app = express();
app.use(applyCorsHeaders);
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());
app.use(
  fileUpload({
    createParentPath: true
  })
);

app.get('/health', (req, res) => {
  return res.status(200).json({ status: 'ok' });
});

registerRoutes(app);
registerErrorHandler(app);
configureCronJobs();
console.log('[startup] All routes registered');

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled promise rejection:', reason);
});

module.exports = app;

if (process.env.NODE_ENV !== 'test') {
  const port = Number(process.env.PORT) || 4321;

  app.listen(port, () => {
    console.log(`Listening on ${port}`);
  });
}
