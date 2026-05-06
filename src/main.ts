import { NestFactory } from '@nestjs/core';
import {
  VersioningType,
  Logger,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { I18nValidationPipe } from './common/pipes/i18n-validation.pipe';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // ── Security ─────────────────────────────────────────────────────
  app.use(helmet());
  app.use(cookieParser()); // ← parse HTTP-only cookies
  app.enableCors({
    origin: configService.get<string>('app.clientUrl', 'http://localhost:3000'),
    credentials: true, // bắt buộc để cookie hoạt động cross-origin
  });

  // ── API Prefix & Versioning ──────────────────────────────────────
  const apiPrefix = configService.get<string>('app.apiPrefix', 'api');
  app.setGlobalPrefix(apiPrefix);
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: String(configService.get<number>('app.apiVersion', 1)),
  });

  // ── Validation ───────────────────────────────────────────────────
  // I18nValidationPipe extends ValidationPipe with per-field i18n error messages.
  // GlobalExceptionFilter is registered via APP_FILTER in AppModule (DI pattern).
  app.useGlobalPipes(new I18nValidationPipe());
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

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
