import { app } from './app.js';
import { env } from './config/env.js';
import { connectDB } from './lib/db.js';

const PORT = env.PORT || 5000;

async function start() {
  if (env.MONGODB_URI) {
    try {
      await connectDB();
      console.log('[RailPeek Server] MongoDB connection initialized.');
    } catch (err) {
      console.warn('[RailPeek Server] Running with deferred MongoDB connection:', err.message);
    }
  }

  app.listen(PORT, () => {
    console.log(`[RailPeek Server] Server listening on port ${PORT}`);
    console.log(`[RailPeek Server] Environment: ${env.NODE_ENV} | Provider: ${env.RAILWAY_PROVIDER}`);
  });
}

start();
