import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') || 3001;
  const corsOrigin = configService.get<string>('CORS_ORIGIN') || 'http://localhost:5173';

  // Enable CORS
  app.enableCors({
    origin: corsOrigin.split(',').map((o) => o.trim()),
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Set global API prefix
  app.setGlobalPrefix('api/v1', {
    exclude: ['health'],
  });

  // OpenAPI (Swagger) Setup
  const config = new DocumentBuilder()
    .setTitle('TaskFlow API')
    .setDescription('TaskFlow RESTful Backend API Specification')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  await app.listen(port);
  logger.log(`TaskFlow Backend running on port ${port}`);
  logger.log(`Health endpoint: http://localhost:${port}/health`);
  logger.log(`API Docs: http://localhost:${port}/docs`);
}

bootstrap().catch((err) => {
  console.error('Failed to bootstrap TaskFlow backend:', err);
  process.exit(1);
});
