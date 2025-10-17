interface LogLevel {
  ERROR: 'error';
  WARN: 'warn';
  INFO: 'info';
  DEBUG: 'debug';
}

interface LogContext {
  requestId?: string;
  userId?: string;
  operation?: string;
  duration?: number;
  [key: string]: any;
}

class Logger {
  private levels: LogLevel = {
    ERROR: 'error',
    WARN: 'warn',
    INFO: 'info',
    DEBUG: 'debug'
  };

  private formatMessage(level: string, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` | Context: ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
  }

  error(message: string, error?: Error, context?: LogContext): void {
    const logMessage = this.formatMessage(this.levels.ERROR, message, context);
    console.error(logMessage);
    
    if (error) {
      console.error('Error Details:', {
        name: error.name,
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : 'Stack trace hidden in production'
      });
    }
  }

  warn(message: string, context?: LogContext): void {
    const logMessage = this.formatMessage(this.levels.WARN, message, context);
    console.warn(logMessage);
  }

  info(message: string, context?: LogContext): void {
    const logMessage = this.formatMessage(this.levels.INFO, message, context);
    console.log(logMessage);
  }

  debug(message: string, context?: LogContext): void {
    if (process.env.NODE_ENV === 'development') {
      const logMessage = this.formatMessage(this.levels.DEBUG, message, context);
      console.log(logMessage);
    }
  }

  request(method: string, url: string, statusCode: number, duration: number, context?: LogContext): void {
    const message = `${method} ${url} - ${statusCode} - ${duration}ms`;
    const requestContext = { ...context, method, url, statusCode, duration };
    
    if (statusCode >= 400) {
      this.error(message, undefined, requestContext);
    } else {
      this.info(message, requestContext);
    }
  }

  database(operation: string, success: boolean, duration?: number, context?: LogContext): void {
    const message = `Database ${operation} - ${success ? 'SUCCESS' : 'FAILED'}${duration ? ` (${duration}ms)` : ''}`;
    const dbContext = { ...context, operation, success, duration };
    
    if (success) {
      this.debug(message, dbContext);
    } else {
      this.error(message, undefined, dbContext);
    }
  }
}

export const logger = new Logger();