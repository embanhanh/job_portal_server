import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { I18nService } from 'nestjs-i18n';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // ── Security ─────────────────────────────────────────────────────
  app.use(helmet());
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // ── API Prefix & Versioning ──────────────────────────────────────
  const apiPrefix = configService.get<string>('app.apiPrefix', 'api');
  app.setGlobalPrefix(apiPrefix);
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: String(configService.get<number>('app.apiVersion', 1)),
  });

  // ── Validation ───────────────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // ── Global Exception Filter ──────────────────────────────────────
  const i18nService = app.get(I18nService);
  app.useGlobalFilters(new GlobalExceptionFilter(i18nService));

  // ── Swagger Documentation ────────────────────────────────────────
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Job Portal API')
    .setDescription(
      'High-Performance Recruitment System API — Enterprise-grade architecture with DDD, RBAC, and event-driven design.',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'token',
    )
    .addTag('Auth', 'Authentication & Authorization')
    .addTag('Jobs', 'Job Management')
    .addTag('Applications', 'Job Application Management')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup(`${apiPrefix}/docs`, app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
      filter: true,
      showRequestDuration: true,
    },
  });

  // ── Start Server ─────────────────────────────────────────────────
  const port = configService.get<number>('app.port', 3000);
  await app.listen(port);

  logger.log(`🚀 Server running on http://localhost:${port}`);
  logger.log(`📚 Swagger docs at http://localhost:${port}/${apiPrefix}/docs`);
  logger.log(`🌍 Environment: ${configService.get<string>('app.env')}`);
}

bootstrap().catch((err) => {
  console.error('Application failed to start:', err);
  process.exit(1);
});
