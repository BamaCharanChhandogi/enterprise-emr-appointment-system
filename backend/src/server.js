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

    // Graceful Shutdown handling
    const gracefulShutdown = () => {
      console.log('\n🛑 Received kill signal, shutting down gracefully...');
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
