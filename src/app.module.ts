import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { BullModule } from '@nestjs/bullmq';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AcceptLanguageResolver, I18nModule, QueryResolver } from 'nestjs-i18n';
import { ClsModule } from 'nestjs-cls';
import { CacheModule } from '@nestjs/cache-manager';
import * as redisStore from 'cache-manager-redis-store';
import * as path from 'path';
import { Request } from 'express';
import * as crypto from 'crypto';

import {
  appConfig,
  jwtConfig,
  oauthConfig,
  databaseConfig,
  redisConfig,
  elasticsearchConfig,
  cloudinaryConfig,
  firebaseConfig,
} from './config';

import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { EXCEPTION_HANDLERS } from './common/filters/exception-handlers/exception-handler.interface';
import { ValidationExceptionHandler } from './common/filters/exception-handlers/validation-exception.handler';
import { HttpExceptionHandler } from './common/filters/exception-handlers/http-exception.handler';
import { QueryFailedExceptionHandler } from './common/filters/exception-handlers/query-failed-exception.handler';
import { EntityNotFoundExceptionHandler } from './common/filters/exception-handlers/entity-not-found-exception.handler';
import { FallbackExceptionHandler } from './common/filters/exception-handlers/fallback-exception.handler';

import { AuthModule } from './modules/auth/auth.module';
import { JobModule } from './modules/job/job.module';
import { ApplicationModule } from './modules/application/application.module';
import { MasterDataModule } from './modules/master-data/master-data.module';
import { CandidateModule } from './modules/candidate/candidate.module';
import { CompanyModule } from './modules/company/company.module';
import { NotificationModule } from './modules/notification/notification.module';
import { AdminModule } from './modules/admin/admin.module';
import { EmailModule } from './modules/email/email.module';

@Module({
  imports: [
    // ── Configuration ────────────────────────────────────────────────
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [
        appConfig,
        jwtConfig,
        oauthConfig,
        databaseConfig,
        redisConfig,
        elasticsearchConfig,
        cloudinaryConfig,
        firebaseConfig,
      ],
    }),

    // ── Database (TypeORM + PostgreSQL) ──────────────────────────────
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('database.host'),
        port: config.get<number>('database.port'),
        username: config.get<string>('database.username'),
        password: config.get<string>('database.password'),
        database: config.get<string>('database.name'),
        ssl: config.get<boolean>('database.ssl')
          ? { rejectUnauthorized: false }
          : false,
        autoLoadEntities: true,
        synchronize: config.get<string>('app.env') === 'development',
        // logging: config.get<string>('app.env') === 'development',
      }),
    }),

    // ── Rate Limiting ────────────────────────────────────────────────
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            ttl: config.get<number>('THROTTLE_TTL', 60000),
            limit: config.get<number>('THROTTLE_LIMIT', 60),
          },
        ],
      }),
    }),

    // ── Event Emitter ────────────────────────────────────────────────
    EventEmitterModule.forRoot({
      wildcard: true,
      delimiter: '.',
      maxListeners: 20,
    }),

    // ── BullMQ (Redis Queues) ────────────────────────────────────────
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get<string>('redis.host'),
          port: config.get<number>('redis.port'),
          password: config.get<string>('redis.password'),
        },
      }),
    }),

    // ── I18n ─────────────────────────────────────────────────────────
    I18nModule.forRoot({
      fallbackLanguage: 'en',
      loaderOptions: {
        path: path.join(__dirname, '/i18n/'),
        watch: true,
      },
      resolvers: [
        { use: QueryResolver, options: ['lang'] },
        AcceptLanguageResolver,
      ],
    }),

    // ── Global Context (CLS) ─────────────────────────────────────────
    ClsModule.forRoot({
      global: true,
      middleware: {
        mount: true,
        setup: (cls, req: Request) => {
          const acceptLang = req.headers['accept-language'] as string;
          const lang = acceptLang?.split(',')[0]?.trim() || 'vi';
          cls.set('lang', lang);
          // Set requestId for correlation in logs
          cls.set('requestId', crypto.randomUUID());
        },
      },
    }),

    // ── Global Caching ───────────────────────────────────────────────
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        store: redisStore,
        host: config.get<string>('redis.host'),
        port: config.get<number>('redis.port'),
        password: config.get<string>('redis.password'),
        ttl: 60 * 60, // 1 hour by default
      }),
    }),

    // ── Feature Modules ──────────────────────────────────────────────
    AuthModule,
    JobModule,
    ApplicationModule,
    MasterDataModule,
    CandidateModule,
    CompanyModule,
    NotificationModule,
    AdminModule,
    EmailModule,
  ],
  providers: [
    // Global Throttler Guard
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    // Global Logging Interceptor (should run before ResponseInterceptor)
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    // Global Response Interceptor
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
    // ── Exception Handlers (order matters — first match wins) ─────────
    // ValidationExceptionHandler MUST come before HttpExceptionHandler
    // because UnprocessableEntityException extends HttpException.
    ValidationExceptionHandler,
    HttpExceptionHandler,
    QueryFailedExceptionHandler,
    EntityNotFoundExceptionHandler,
    FallbackExceptionHandler,
    {
      provide: EXCEPTION_HANDLERS,
      useFactory: (
        validation: ValidationExceptionHandler,
        http: HttpExceptionHandler,
        queryFailed: QueryFailedExceptionHandler,
        entityNotFound: EntityNotFoundExceptionHandler,
        fallback: FallbackExceptionHandler,
      ) => [validation, http, queryFailed, entityNotFound, fallback],
      inject: [
        ValidationExceptionHandler,
        HttpExceptionHandler,
        QueryFailedExceptionHandler,
        EntityNotFoundExceptionHandler,
        FallbackExceptionHandler,
      ],
    },
    // Global Exception Filter via DI (APP_FILTER)
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
})
export class AppModule {}
