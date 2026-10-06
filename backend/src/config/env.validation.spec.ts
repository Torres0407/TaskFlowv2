import 'reflect-metadata';
import { validateEnv } from './env.validation';

describe('Environment Validation', () => {
  const validConfig: Record<string, unknown> = {
    DATABASE_URL: 'postgresql://postgres:pass@localhost:6543/postgres?pgbouncer=true',
    DIRECT_URL: 'postgresql://postgres:pass@localhost:5432/postgres',
    SUPABASE_URL: 'https://test-ref.supabase.co',
    SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
    JWT_ACCESS_SECRET: 'test-access-secret-minimum-16-characters',
    JWT_REFRESH_SECRET: 'test-refresh-secret-minimum-16-characters',
    REDIS_URL: 'redis://localhost:6379',
    GEMINI_API_KEY: 'test-gemini-key',
    CORS_ORIGIN: 'http://localhost:5173',
    PORT: 3001,
    NODE_ENV: 'development',
  };

  it('validates a complete and valid environment configuration', () => {
    const result = validateEnv(validConfig);
    expect(result.DATABASE_URL).toBe(validConfig.DATABASE_URL);
    expect(result.PORT).toBe(3001);
  });

  it('throws an error when a required variable is missing (fail fast)', () => {
    const invalidConfig = { ...validConfig };
    delete invalidConfig.DATABASE_URL;

    expect(() => validateEnv(invalidConfig)).toThrow(
      /\[CONFIG_VALIDATION_ERROR\] Environment validation failed/,
    );
  });

  it('throws an error when JWT secrets are too short', () => {
    const invalidConfig = {
      ...validConfig,
      JWT_ACCESS_SECRET: 'short',
    };

    expect(() => validateEnv(invalidConfig)).toThrow(
      /JWT_ACCESS_SECRET must be at least 16 characters/,
    );
  });
});
