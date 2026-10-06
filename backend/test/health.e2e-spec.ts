// Set test environment variables BEFORE importing AppModule
process.env.DATABASE_URL = 'postgresql://postgres:pass@localhost:6543/postgres?pgbouncer=true';
process.env.DIRECT_URL = 'postgresql://postgres:pass@localhost:5432/postgres';
process.env.SUPABASE_URL = 'https://test-ref.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
process.env.JWT_ACCESS_SECRET = 'test-access-secret-minimum-16-characters';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-minimum-16-characters';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.GEMINI_API_KEY = 'test-gemini-key';
process.env.CORS_ORIGIN = 'http://localhost:5173';
process.env.PORT = '3001';
process.env.NODE_ENV = 'test';

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('HealthController (e2e)', () => {
  let app: INestApplication;
  const mockPrismaService = {
    $queryRaw: jest.fn().mockResolvedValue([{ 1: 1 }]),
    $connect: jest.fn().mockResolvedValue(undefined),
    $disconnect: jest.fn().mockResolvedValue(undefined),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrismaService)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('/health (GET) returns 200 and database connected status', () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect((res) => {
        expect(res.body.status).toBe('ok');
        expect(res.body.database).toBe('connected');
        expect(res.body.timestamp).toBeDefined();
      });
  });
});
