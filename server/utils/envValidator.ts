import zod from 'zod';

/**
 * Environment Variable Validation
 * Ensures all required environment variables are present and valid
 */

const envSchema = zod.object({
  // Core
  NODE_ENV: zod.enum(['development', 'production', 'test']).default('development'),
  PORT: zod.string().regex(/^\d+$/).transform(Number).default('5000'),
  
  // Database
  DATABASE_URL: zod.string().url('DATABASE_URL must be a valid PostgreSQL connection string'),
  
  // Authentication
  JWT_SECRET: zod.string().min(32, 'JWT_SECRET must be at least 32 characters for security'),
  SESSION_SECRET: zod.string().min(32, 'SESSION_SECRET must be at least 32 characters for security'),
  
  // External Services
  CLOUDINARY_URL: zod.string().url('CLOUDINARY_URL must be a valid URL').optional(),
  
  // Optional
  FRONTEND_URL: zod.string().url().optional().default('http://localhost:5000'),
  ALLOWED_ORIGINS: zod.string().optional(),
});

export type EnvConfig = zod.infer<typeof envSchema>;

/**
 * Validate and parse environment variables
 * @throws Error if validation fails
 */
export function validateEnvironment(): EnvConfig {
  try {
    const config = envSchema.parse(process.env);
    
    // Additional security checks
    if (config.NODE_ENV === 'production') {
      // In production, ensure secrets are strong
      if (config.JWT_SECRET.length < 64) {
        console.warn('⚠️  WARNING: JWT_SECRET should be at least 64 characters in production');
      }
      
      if (config.SESSION_SECRET.length < 64) {
        console.warn('⚠️  WARNING: SESSION_SECRET should be at least 64 characters in production');
      }

      if (!config.CLOUDINARY_URL) {
        console.warn('⚠️  WARNING: CLOUDINARY_URL not set - file uploads will fail');
      }
    }
    
    return config;
  } catch (error) {
    if (error instanceof zod.ZodError) {
      console.error('❌ Environment validation failed:');
      error.errors.forEach(err => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
      throw new Error('Invalid environment configuration. Please check your .env file.');
    }
    throw error;
  }
}

/**
 * Get validated environment configuration
 * Caches the result after first validation
 */
let cachedConfig: EnvConfig | null = null;

export function getEnvConfig(): EnvConfig {
  if (!cachedConfig) {
    cachedConfig = validateEnvironment();
  }
  return cachedConfig;
}

/**
 * Check if running in production
 */
export function isProduction(): boolean {
  return getEnvConfig().NODE_ENV === 'production';
}

/**
 * Check if running in development
 */
export function isDevelopment(): boolean {
  return getEnvConfig().NODE_ENV === 'development';
}

/**
 * Get allowed CORS origins
 */
export function getAllowedOrigins(): string[] {
  const config = getEnvConfig();
  
  if (config.ALLOWED_ORIGINS) {
    return config.ALLOWED_ORIGINS.split(',').map(origin => origin.trim());
  }
  
  // Default allowed origins
  return [
    config.FRONTEND_URL,
    'http://localhost:5000',
    'http://localhost:3000',
  ];
}
