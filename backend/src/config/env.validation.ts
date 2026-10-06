import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MinLength,
  validateSync,
} from 'class-validator';

export enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

export class EnvironmentVariables {
  @IsString()
  @IsNotEmpty({
    message: 'DATABASE_URL is required (Supabase pooled connection string with ?pgbouncer=true)',
  })
  DATABASE_URL!: string;

  @IsString()
  @IsNotEmpty({
    message: 'DIRECT_URL is required (Supabase direct connection string for migrations)',
  })
  DIRECT_URL!: string;

  @IsString()
  @IsNotEmpty({ message: 'SUPABASE_URL is required (Storage signed URLs)' })
  SUPABASE_URL!: string;

  @IsString()
  @IsNotEmpty({ message: 'SUPABASE_SERVICE_ROLE_KEY is required (Server only)' })
  SUPABASE_SERVICE_ROLE_KEY!: string;

  @IsString()
  @IsNotEmpty({ message: 'JWT_ACCESS_SECRET is required (Token signing)' })
  @MinLength(16, { message: 'JWT_ACCESS_SECRET must be at least 16 characters' })
  JWT_ACCESS_SECRET!: string;

  @IsString()
  @IsNotEmpty({ message: 'JWT_REFRESH_SECRET is required (Token signing)' })
  @MinLength(16, { message: 'JWT_REFRESH_SECRET must be at least 16 characters' })
  JWT_REFRESH_SECRET!: string;

  @IsString()
  @IsNotEmpty({ message: 'REDIS_URL is required (Redis for rate limiting and cache)' })
  REDIS_URL!: string;

  @IsString()
  @IsNotEmpty({ message: 'GEMINI_API_KEY is required (Assistant integration in Phase 8)' })
  GEMINI_API_KEY!: string;

  @IsString()
  @IsNotEmpty({ message: 'CORS_ORIGIN is required (Allowed frontend origin)' })
  CORS_ORIGIN!: string;

  @IsNumber()
  @IsOptional()
  PORT: number = 3001;

  @IsEnum(Environment)
  @IsOptional()
  NODE_ENV: Environment = Environment.Development;
}

export function validateEnv(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    const errorMessages = errors
      .map((err) => Object.values(err.constraints || {}).join(', '))
      .join('; ');
    throw new Error(`[CONFIG_VALIDATION_ERROR] Environment validation failed: ${errorMessages}`);
  }

  return validatedConfig;
}
