require('dotenv').config();
const http = require('http');
const app = require('./app');
const { connectDB } = require('./config/db');
const { initSocket } = require('./config/socket');
const { seedInitialData } = require('./utils/seeder');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // 1. Connect to Database (auto-starts in-memory replica set if no URI provided)
    await connectDB();

    // 2. Automatically seed initial sample users & doctors if collection is empty
    await seedInitialData();

    // 3. Create HTTP Server
    const server = http.createServer(app);

    // 4. Initialize WebSocket Server
    initSocket(server, process.env.CLIENT_URL || 'http://localhost:5173');

    // 5. Start listening
    server.listen(PORT, () => {
      console.log(`===================================================`);
      console.log(`🏥 Enterprise EMR System API Server Ready!`);
      console.log(`📡 HTTP & WebSocket listening on port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 Health Check: http://localhost:${PORT}/api/health`);
      console.log(`===================================================`);
    });

    // 6. Keep-Alive Self-Pinger (pings health endpoint every 10 minutes to prevent Render cold starts)
    const https = require('https');
    const targetUrl = process.env.RENDER_EXTERNAL_URL || process.env.BACKEND_URL || 'https://enterprise-emr-appointment-system-90u6.onrender.com';
    const pingEndpoint = `${targetUrl.replace(/\/$/, '')}/api/health`;
    const PING_INTERVAL = 10 * 60 * 1000; // 10 minutes

    console.log(`⏱️ Keep-Alive Worker initialized: pinging ${pingEndpoint} every 10 minutes.`);

    const pingHealth = () => {
      try {
        const client = pingEndpoint.startsWith('https') ? https : http;
        const pingReq = client.get(pingEndpoint, (res) => {
          let chunks = '';
          res.on('data', d => chunks += d);
          res.on('end', () => {
            console.log(`[Keep-Alive Ping] ${new Date().toISOString()} - Status ${res.statusCode} from ${pingEndpoint}`);
          });
        });

        pingReq.on('error', (err) => {
          console.warn(`[Keep-Alive Ping] Notice: ${err.message}`);
        });

        pingReq.setTimeout(10000, () => {
          pingReq.destroy();
        });
      } catch (err) {
        console.warn('[Keep-Alive Ping] Error:', err.message);
      }
    };

    // First ping after 30 seconds of booting, then every 10 minutes
    const initialTimeout = setTimeout(pingHealth, 30 * 1000);
    const keepAliveTimer = setInterval(pingHealth, PING_INTERVAL);

    // Graceful Shutdown handling
    const gracefulShutdown = () => {
      console.log('\n🛑 Received kill signal, shutting down gracefully...');
      clearTimeout(initialTimeout);
      clearInterval(keepAliveTimer);
      server.close(() => {
        console.log('🚪 HTTP/WS server closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
