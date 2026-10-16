import app from './src/app.js';
import { env, assertEnv } from './src/config/env.js';
import { connectDB } from './src/config/db.js';

async function start() {
  assertEnv();
  await connectDB();
  const server = app.listen(env.port, () => {
    console.log(`MORAQQA API running on port ${env.port} (${env.nodeEnv})`);
  });

  const shutdown = (signal) => {
    console.log(`${signal} received, shutting down`);
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 10000).unref();
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

start().catch((err) => {
  console.error('Failed to start server:', err.message);
  process.exit(1);
});
