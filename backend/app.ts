
import 'reflect-metadata';
import express, { Express } from "express";
import cors from "cors";
import morgan from "morgan";
const fileUpload = require("express-fileupload");
import { createServer } from 'http';
import { initializeDatabase, closeDatabaseConnection } from '@/src/infrastructure/config/database';
import { SocketManager } from '@/src/infrastructure/socket/SocketManager';
import { createApiRoutes } from '@/src/presentation/routes';
import { TaskEventHandlers } from '@/src/infrastructure/events/TaskEventHandlers';
import { errorHandler, notFoundHandler } from '@/src/presentation/middleware/errorHandler';
import { requestLogger } from '@/src/presentation/middleware/requestLogger';
import { logger } from '@/src/shared/utils/logger';
import { AppError } from '@/src/shared/errors/AppError';

const app: Express = express();

interface AppConfig {
  port: number | string;
}

interface AppResult {
  app: Express;
  port: number | string;
  httpServer: any;
  socketManager: SocketManager;
  usingFallbackDatabase: boolean;
}

export const createApp = async ({ port }: AppConfig): Promise<AppResult> => {
  try {
    logger.info('Starting application initialization', {
      port,
      nodeEnv: process.env.NODE_ENV,
      version: process.env.npm_package_version
    });

    // Initialize database with fallback support
    const { dataSource, usingFallback } = await initializeDatabase();
    
    // Set the active data source for repositories
    const { setActiveDataSource } = await import('./src/shared/utils/database.js');
    setActiveDataSource(dataSource);
    
    logger.info('Database initialization completed', {
      usingFallback,
      databaseType: dataSource.options.type
    });

    // Add request logging middleware first
    app.use(requestLogger);

    // Enhanced Morgan logging with request ID
    app.use(morgan('combined', {
      stream: {
        write: (message: string) => {
          logger.info(`HTTP: ${message.trim()}`);
        }
      }
    }));

    // CORS configuration
    app.use(
      cors({
        origin: process.env.NODE_ENV === 'production' 
          ? ['https://yourdomain.com'] // Replace with actual production domain
          : "*",
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
        credentials: process.env.NODE_ENV === 'production'
      })
    );

    // Body parsing middleware
    app.use(express.json({ 
      limit: "50mb",
      verify: (req: any, res, buf) => {
        req.rawBody = buf.toString();
      }
    }));
    app.use(express.urlencoded({ extended: true, limit: "50mb" })); 

    // File upload middleware
    app.use(
      fileUpload({
        limits: { fileSize: 10 * 1024 * 1024 },
        abortOnLimit: true,
        responseOnLimit: "File size limit exceeded (10MB maximum)",
        createParentPath: true
      })
    );

    // Create HTTP server and Socket.IO manager
    const httpServer = createServer(app);
    const socketManager = new SocketManager(httpServer);

    // Initialize event handlers
    new TaskEventHandlers(socketManager);

    // API routes
    app.use('/api', createApiRoutes(socketManager));

    // Enhanced health check endpoint
    app.get('/health', (req, res) => {
      const healthCheck = {
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV,
        database: {
          connected: dataSource.isInitialized,
          type: dataSource.options.type,
          usingFallback
        },
        memory: process.memoryUsage(),
        version: process.env.npm_package_version || '1.0.0'
      };

      logger.debug('Health check requested', {
        requestId: (req as any).requestId,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.json(healthCheck);
    });

    // 404 handler for undefined routes
    app.use(notFoundHandler);

    // Global error handler (must be last)
    app.use(errorHandler);

    // Graceful shutdown handlers
    const gracefulShutdown = async (signal: string) => {
      logger.info(`Received ${signal}, starting graceful shutdown`);
      
      try {
        // Close database connections
        await closeDatabaseConnection();
        
        // Close HTTP server
        httpServer.close(() => {
          logger.info('HTTP server closed');
          process.exit(0);
        });

        // Force exit after 30 seconds
        setTimeout(() => {
          logger.error('Forced shutdown after timeout');
          process.exit(1);
        }, 30000);
      } catch (error) {
        logger.error('Error during graceful shutdown', error as Error);
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error: Error) => {
      logger.error('Uncaught Exception', error, {
        critical: true,
        stack: error.stack
      });
      
      // Attempt graceful shutdown
      gracefulShutdown('uncaughtException');
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
      logger.error('Unhandled Promise Rejection', new Error(reason), {
        critical: true,
        promise: promise.toString()
      });
      
      // Attempt graceful shutdown
      gracefulShutdown('unhandledRejection');
    });

    logger.info('Application initialization completed successfully', {
      port,
      databaseType: dataSource.options.type,
      usingFallbackDatabase: usingFallback,
      middlewareCount: app._router?.stack?.length || 0
    });

    return { app, port, httpServer, socketManager, usingFallbackDatabase: usingFallback };

  } catch (error) {
    logger.error('Application initialization failed', error as Error);
    throw new AppError('Failed to initialize application', 500, false);
  }
};
