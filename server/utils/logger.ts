/**
 * Centralized Logging System
 * 
 * Provides structured logging with multiple levels and optional persistence
 * Supports development and production environments
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4,
}

interface LogEntry {
  timestamp: string;
  level: keyof typeof LogLevel;
  message: string;
  context?: string;
  metadata?: Record<string, any>;
  error?: {
    message: string;
    stack?: string;
    name: string;
  };
}

class Logger {
  private minLevel: LogLevel;
  private context: string;

  constructor(context: string = 'App', minLevel: LogLevel = LogLevel.INFO) {
    this.context = context;
    this.minLevel = minLevel;

    // Set minLevel based on environment
    if (process.env.NODE_ENV === 'development') {
      this.minLevel = LogLevel.DEBUG;
    } else if (process.env.NODE_ENV === 'production') {
      this.minLevel = LogLevel.INFO;
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.minLevel;
  }

  private formatLog(entry: LogEntry): string {
    const { timestamp, level, message, context, metadata, error } = entry;
    
    let formatted = `[${timestamp}] [${level}]`;
    
    if (context) {
      formatted += ` [${context}]`;
    }
    
    formatted += ` ${message}`;
    
    if (metadata && Object.keys(metadata).length > 0) {
      formatted += `\n  Metadata: ${JSON.stringify(metadata, null, 2)}`;
    }
    
    if (error) {
      formatted += `\n  Error: ${error.name}: ${error.message}`;
      if (error.stack) {
        formatted += `\n  Stack: ${error.stack}`;
      }
    }
    
    return formatted;
  }

  private log(level: keyof typeof LogLevel, message: string, metadata?: Record<string, any>, error?: Error) {
    const logLevel = LogLevel[level];
    
    if (!this.shouldLog(logLevel)) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: this.context,
      metadata,
    };

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }

    const formatted = this.formatLog(entry);

    // Console output with colors
    switch (level) {
      case 'DEBUG':
        console.debug('\x1b[36m%s\x1b[0m', formatted); // Cyan
        break;
      case 'INFO':
        console.info('\x1b[32m%s\x1b[0m', formatted); // Green
        break;
      case 'WARN':
        console.warn('\x1b[33m%s\x1b[0m', formatted); // Yellow
        break;
      case 'ERROR':
        console.error('\x1b[31m%s\x1b[0m', formatted); // Red
        break;
      case 'FATAL':
        console.error('\x1b[35m%s\x1b[0m', formatted); // Magenta
        break;
    }

    // In production, send to external logging service
    if (process.env.NODE_ENV === 'production' && logLevel >= LogLevel.ERROR) {
      this.sendToExternalService(entry);
    }
  }

  private sendToExternalService(entry: LogEntry) {
    // TODO: Integrate with external logging service (e.g., Datadog, LogRocket, Sentry)
    // For now, just ensure it's logged
    // Example: axios.post('https://logging-service.com/api/logs', entry);
  }

  debug(message: string, metadata?: Record<string, any>) {
    this.log('DEBUG', message, metadata);
  }

  info(message: string, metadata?: Record<string, any>) {
    this.log('INFO', message, metadata);
  }

  warn(message: string, metadata?: Record<string, any>) {
    this.log('WARN', message, metadata);
  }

  error(message: string, error?: Error, metadata?: Record<string, any>) {
    this.log('ERROR', message, metadata, error);
  }

  fatal(message: string, error?: Error, metadata?: Record<string, any>) {
    this.log('FATAL', message, metadata, error);
    
    // In production, fatal errors should trigger alerts
    if (process.env.NODE_ENV === 'production') {
      // TODO: Trigger alert/notification system
    }
  }

  // Create child logger with additional context
  child(additionalContext: string): Logger {
    return new Logger(`${this.context}:${additionalContext}`, this.minLevel);
  }
}

// Create default loggers for different parts of the application
export const logger = new Logger('Server');
export const authLogger = new Logger('Auth');
export const dbLogger = new Logger('Database');
export const apiLogger = new Logger('API');
export const socketLogger = new Logger('Socket');

// Export class for custom loggers
export { Logger };

// Export convenience functions
export default logger;
