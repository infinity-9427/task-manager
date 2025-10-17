import { DataSource } from 'typeorm';
import { User } from '@/src/domain/user/entities/User';
import { Task } from '@/src/domain/task/entities/Task';
import { Message } from '@/src/domain/message/entities/Message';
import { logger } from '@/src/shared/utils/logger';
import { DatabaseError } from '@/src/shared/errors/AppError';

interface DatabaseConfig {
  maxRetries: number;
  retryDelay: number;
  connectionTimeout: number;
  enableFallback: boolean;
}

const config: DatabaseConfig = {
  maxRetries: 3,
  retryDelay: 5000, // 5 seconds
  connectionTimeout: 30000, // 30 seconds
  enableFallback: process.env.NODE_ENV === 'development'
};

const createPostgresDataSource = (): DataSource => {
  const connectionUrl = process.env.NEON_CONNECTION;
  
  if (!connectionUrl) {
    throw new DatabaseError('NEON_CONNECTION environment variable is not set');
  }

  logger.info('Configuring PostgreSQL connection', {
    host: connectionUrl.includes('@') ? connectionUrl.split('@')[1]?.split('/')[0] : 'unknown',
    ssl: true,
    environment: process.env.NODE_ENV
  });

  return new DataSource({
    type: 'postgres',
    url: connectionUrl,
    synchronize: process.env.NODE_ENV !== 'production',
    logging: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : false,
    entities: [User, Task, Message],
    migrations: ['src/infrastructure/database/migrations/*.ts'],
    subscribers: ['src/infrastructure/database/subscribers/*.ts'],
    ssl: {
      rejectUnauthorized: false
    },
    connectTimeoutMS: config.connectionTimeout,
    maxQueryExecutionTime: 10000, // 10 seconds
    poolErrorHandler: (error: Error) => {
      logger.error('Database pool error', error, { operation: 'pool_management' });
    }
  });
};

const createSqliteDataSource = (): DataSource => {
  logger.warn('Falling back to SQLite database - PostgreSQL connection failed');
  
  return new DataSource({
    type: 'sqlite',
    database: ':memory:',
    synchronize: true,
    logging: process.env.NODE_ENV === 'development',
    entities: [User, Task, Message],
  });
};

// Create data sources lazily to avoid startup errors
let primaryDataSource: DataSource | null = null;
let fallbackDataSource: DataSource | null = null;

export const initializeDatabase = async (): Promise<{ dataSource: DataSource; usingFallback: boolean }> => {
  let retries = 0;
  let lastError: Error | null = null;

  // Initialize primary data source
  if (!primaryDataSource) {
    try {
      primaryDataSource = createPostgresDataSource();
    } catch (error) {
      logger.error('Failed to create PostgreSQL data source configuration', error as Error);
      lastError = error as Error;
      // Skip to fallback if configuration fails
      retries = config.maxRetries + 1;
    }
  }

  // Attempt PostgreSQL connection with retries
  while (retries <= config.maxRetries && primaryDataSource) {
    try {
      logger.info(`Attempting to connect to PostgreSQL database (attempt ${retries + 1}/${config.maxRetries + 1})`);
      
      const startTime = Date.now();
      await primaryDataSource.initialize();
      const duration = Date.now() - startTime;
      
      logger.info('PostgreSQL database connected successfully', {
        duration,
        entities: primaryDataSource.entityMetadatas.length,
        migrations: primaryDataSource.migrations.length
      });
      
      // Test the connection
      await primaryDataSource.query('SELECT NOW()');
      logger.debug('Database connection test successful');
      
      return { dataSource: primaryDataSource, usingFallback: false };
    } catch (error) {
      lastError = error as Error;
      retries++;
      
      logger.error(`PostgreSQL connection attempt ${retries} failed`, error as Error, {
        attempt: retries,
        maxRetries: config.maxRetries,
        retryDelay: config.retryDelay
      });

      if (retries <= config.maxRetries) {
        logger.info(`Waiting ${config.retryDelay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, config.retryDelay));
      }
    }
  }

  // All PostgreSQL connection attempts failed
  logger.error('All PostgreSQL connection attempts failed', lastError!, {
    totalAttempts: retries,
    fallbackAvailable: config.enableFallback
  });

  // Try fallback database if enabled
  if (config.enableFallback) {
    try {
      logger.warn('Attempting to initialize fallback SQLite database');
      
      if (!fallbackDataSource) {
        fallbackDataSource = createSqliteDataSource();
      }
      
      const startTime = Date.now();
      await fallbackDataSource.initialize();
      const duration = Date.now() - startTime;
      
      logger.warn('Fallback SQLite database initialized successfully', {
        duration,
        warning: 'Using in-memory database - data will not persist'
      });
      
      return { dataSource: fallbackDataSource, usingFallback: true };
    } catch (fallbackError) {
      logger.error('Fallback database initialization failed', fallbackError as Error);
      throw new DatabaseError('Both primary and fallback database connections failed', fallbackError as Error);
    }
  }

  throw new DatabaseError('Database connection failed after all retry attempts', lastError!);
};

export const closeDatabaseConnection = async (): Promise<void> => {
  try {
    if (primaryDataSource?.isInitialized) {
      await primaryDataSource.destroy();
      logger.info('PostgreSQL connection closed successfully');
    }
    
    if (fallbackDataSource?.isInitialized) {
      await fallbackDataSource.destroy();
      logger.info('Fallback database connection closed successfully');
    }
  } catch (error) {
    logger.error('Error closing database connections', error as Error);
    throw error;
  }
};