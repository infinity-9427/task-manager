import * as dotenv from 'dotenv';
import { createApp } from "./app";
import { logger } from '@/src/shared/utils/logger';
import { AppError } from '@/src/shared/errors/AppError';

// Load environment variables
dotenv.config();

const PORT: number | string = process.env.PORT || 5000;
const HOST: string = process.env.HOST || 'localhost';

const startServer = async () => {
  const startTime = Date.now();
  
  try {
    logger.info('🚀 Starting server initialization', {
      port: PORT,
      host: HOST,
      nodeEnv: process.env.NODE_ENV,
      nodeVersion: process.version,
      platform: process.platform
    });

    // Validate environment variables
    if (!process.env.JWT_SECRET) {
      throw new AppError('JWT_SECRET environment variable is required', 500, false);
    }

    if (!process.env.NEON_CONNECTION) {
      logger.warn('NEON_CONNECTION not set - will attempt to use fallback database');
    }

    const { httpServer, socketManager, usingFallbackDatabase } = await createApp({ port: PORT });

    // Start the HTTP server
    httpServer.listen(PORT, HOST, () => {
      const initTime = Date.now() - startTime;
      
      logger.info('🎉 Server started successfully', {
        port: PORT,
        host: HOST,
        initializationTime: `${initTime}ms`,
        usingFallbackDatabase,
        urls: {
          server: `http://${HOST}:${PORT}`,
          api: `http://${HOST}:${PORT}/api`,
          health: `http://${HOST}:${PORT}/health`,
          docs: `http://${HOST}:${PORT}/api/docs` // Future API documentation
        }
      });

      console.log(`
┌─────────────────────────────────────────────────────────────┐
│                    🚀 Server Started                        │
├─────────────────────────────────────────────────────────────┤
│  Server URL: http://${HOST}:${PORT}                         │
│  API Base:   http://${HOST}:${PORT}/api                     │
│  Health:     http://${HOST}:${PORT}/health                  │
│  Socket.IO:  ✅ Ready for real-time connections             │
│  Database:   ${usingFallbackDatabase ? '⚠️  SQLite (Fallback)' : '✅ PostgreSQL'}            │
│  Environment: ${process.env.NODE_ENV || 'development'}                                │
│  Init Time:   ${initTime}ms                                 │
└─────────────────────────────────────────────────────────────┘
      `);

      if (usingFallbackDatabase) {
        console.log(`
⚠️  WARNING: Using fallback SQLite database
   Data will not persist between server restarts
   Please check your PostgreSQL connection
        `);
      }
    });

    // Handle server errors
    httpServer.on('error', (error: NodeJS.ErrnoException) => {
      if (error.code === 'EADDRINUSE') {
        logger.error(`Port ${PORT} is already in use`, error, {
          port: PORT,
          host: HOST,
          suggestion: 'Try a different port or stop the conflicting process'
        });
        process.exit(1);
      } else if (error.code === 'EACCES') {
        logger.error(`Permission denied to bind to port ${PORT}`, error, {
          port: PORT,
          host: HOST,
          suggestion: 'Try using a port > 1024 or run with elevated privileges'
        });
        process.exit(1);
      } else {
        logger.error('Server error occurred', error);
        process.exit(1);
      }
    });

    // Handle successful server binding
    httpServer.on('listening', () => {
      const addr = httpServer.address();
      const bind = typeof addr === 'string' ? `pipe ${addr}` : `port ${addr?.port}`;
      logger.debug(`Server listening on ${bind}`);
    });

  } catch (error) {
    const initTime = Date.now() - startTime;
    
    logger.error('❌ Failed to start server', error as Error, {
      initializationTime: `${initTime}ms`,
      port: PORT,
      host: HOST,
      nodeEnv: process.env.NODE_ENV
    });

    if (error instanceof AppError) {
      console.error(`\n❌ Server startup failed: ${error.message}`);
      if (error.statusCode === 500 && !error.isOperational) {
        console.error('This is a critical system error that requires immediate attention.');
      }
    } else {
      console.error('\n❌ Unexpected error during server startup:', (error as Error).message);
    }

    console.error('\n🔧 Troubleshooting tips:');
    console.error('1. Check that all required environment variables are set');
    console.error('2. Verify database connection settings');
    console.error('3. Ensure the port is not already in use');
    console.error('4. Check server logs for detailed error information');

    process.exit(1);
  }
};

// Handle startup errors
process.on('unhandledRejection', (reason: any) => {
  logger.error('Unhandled rejection during startup', new Error(reason));
  console.error('❌ Unhandled promise rejection during startup:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught exception during startup', error);
  console.error('❌ Uncaught exception during startup:', error.message);
  process.exit(1);
});

// Start the server
startServer();