import { Request, Response } from 'express';
import { db } from '../../db';

/**
 * Health Check Endpoint Handler
 * 
 * Provides comprehensive system health status including:
 * - API availability
 * - Database connectivity
 * - System uptime
 * - Version information
 */

interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  checks: {
    api: HealthStatus;
    database: HealthStatus;
    memory: HealthStatus;
  };
  environment: string;
}

interface HealthStatus {
  status: 'pass' | 'fail';
  message?: string;
  responseTime?: number;
}

const startTime = Date.now();

/**
 * Check database connectivity
 */
async function checkDatabase(): Promise<HealthStatus> {
  const start = Date.now();
  
  try {
    // Simple query to test connection
    await db.execute('SELECT 1');
    
    return {
      status: 'pass',
      responseTime: Date.now() - start,
    };
  } catch (error) {
    return {
      status: 'fail',
      message: error instanceof Error ? error.message : 'Database connection failed',
      responseTime: Date.now() - start,
    };
  }
}

/**
 * Check memory usage
 */
function checkMemory(): HealthStatus {
  const usage = process.memoryUsage();
  const totalMB = Math.round(usage.heapTotal / 1024 / 1024);
  const usedMB = Math.round(usage.heapUsed / 1024 / 1024);
  const usagePercent = (usedMB / totalMB) * 100;

  if (usagePercent > 90) {
    return {
      status: 'fail',
      message: `High memory usage: ${usedMB}MB / ${totalMB}MB (${usagePercent.toFixed(1)}%)`,
    };
  }

  return {
    status: 'pass',
    message: `${usedMB}MB / ${totalMB}MB (${usagePercent.toFixed(1)}%)`,
  };
}

/**
 * Health check endpoint handler
 */
export async function healthCheckHandler(req: Request, res: Response) {
  const checks = {
    api: { status: 'pass' as const },
    database: await checkDatabase(),
    memory: checkMemory(),
  };

  // Determine overall status
  let status: 'healthy' | 'degraded' | 'unhealthy';
  
  const failedChecks = Object.values(checks).filter(check => check.status === 'fail').length;
  
  if (failedChecks === 0) {
    status = 'healthy';
  } else if (failedChecks === 1) {
    status = 'degraded';
  } else {
    status = 'unhealthy';
  }

  const response: HealthCheckResponse = {
    status,
    timestamp: new Date().toISOString(),
    uptime: Math.floor((Date.now() - startTime) / 1000),
    version: process.env.npm_package_version || '1.0.0',
    checks,
    environment: process.env.NODE_ENV || 'development',
  };

  // Set appropriate HTTP status code
  const httpStatus = status === 'healthy' ? 200 : status === 'degraded' ? 207 : 503;

  res.status(httpStatus).json(response);
}

/**
 * Liveness probe - simple check that API is running
 */
export function livenessProbe(req: Request, res: Response) {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
  });
}

/**
 * Readiness probe - check if API is ready to serve traffic
 */
export async function readinessProbe(req: Request, res: Response) {
  try {
    const dbCheck = await checkDatabase();
    
    if (dbCheck.status === 'pass') {
      res.status(200).json({
        status: 'ready',
        timestamp: new Date().toISOString(),
      });
    } else {
      res.status(503).json({
        status: 'not_ready',
        reason: 'database_unavailable',
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    res.status(503).json({
      status: 'not_ready',
      reason: 'internal_error',
      timestamp: new Date().toISOString(),
    });
  }
}
