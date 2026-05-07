# System Patterns

## Architecture

- **Pattern**: Modular Monolith with DDD principles
- **Flow**: Controller → Service → Repository
- **Events**: EventEmitter2 for decoupled domain events (e.g., Application Status Updates → Notifications)
- **Background Processing**: BullMQ (Redis)
- **File Upload**: Centralized CloudinaryService
- **Database**: TypeORM v0.3.x + PostgreSQL with JSONB for i18n fields

## Type Safety Rules

### No `any` Policy

Use proper typed interfaces instead of `any`. Key patterns:

1. **Authenticated requests**: Use `AuthenticatedRequest` interface (extends `Request`)
2. **File uploads**: Use `Express.Multer.File` with `import type`
3. **TypeORM dynamic queries**: Use `FindOptionsOrder<T>` and `FindOptionsWhere<T>`
4. **Elasticsearch results**: Use `SearchHit<T>` typed interface

### TS1272 Fix Pattern (isolatedModules + emitDecoratorMetadata)

When a type is used in a decorated parameter position, use `import type`:

```typescript
import type { AuthenticatedRequest } from '../../common/interfaces/authenticated-request.interface';

@Req() req: AuthenticatedRequest  // ✅ Works with import type
```

## Response Format

All responses wrapped by `ResponseInterceptor`:

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success", // Auto-translated or custom key from controller
  "data": {},
  "meta": { "page": 1, "limit": 10, "totalItems": 100, ... }
}
```

- **Translatable Success Messages**: If a controller returns an object with a `message` property (e.g., `return { message: 'common.auth.loginSuccess', ... }`), the `ResponseInterceptor` will:
    1.  Use the `message` value as a translation key.
    2.  Translate it using `I18nService`.
    3.  Move it to the top-level `message` field.
    4.  Exclude the `message` key from the `data` object.


## i18n JSONB Pattern

- Store as `{ "vi": "...", "en": "..." }` in PostgreSQL JSONB columns
- Use `BaseService.mapLanguage()` to extract before returning
- Language resolved from `Accept-Language` header or `?lang=` query

## Background Jobs (BullMQ)

All heavy/async operations go through BullMQ:

- **application-scoring** queue: AI/ML candidate scoring
- **elasticsearch-sync** queue: Job indexing to Elasticsearch
- **notification-queue**: Dispatching Push Notifications via Firebase Admin
- **email-queue**: Sending emails asynchronously using Resend/SendGrid

## RBAC

Three roles: `admin`, `employer`, `candidate`

- `@Roles(Role.EMPLOYER, Role.ADMIN)` decorator on controller methods
- `RolesGuard` checks user.role against required roles
- `JwtAuthGuard` must be applied before `RolesGuard`

## Entity Design

- All entities extend `BaseEntity` (UUID, createdAt, updatedAt, deletedAt)
- Soft-delete by default
- Relations use string-based targets for `import type` compatibility

## Error Handling

- Services throw NestJS built-in exceptions (`NotFoundException`, `ConflictException`, etc.)
- `GlobalExceptionFilter` catches all, delegates to registered handlers via DI
- Registered as `APP_FILTER` in AppModule — không dùng `app.useGlobalFilters()` trong main.ts
- Handler order (first match wins): ValidationException → HttpException → QueryFailed → EntityNotFound → Fallback
- TypeORM `QueryFailedError` mapped to `400 Bad Request` (or `409 Conflict` for unique violation)
- TypeORM `EntityNotFoundError` mapped to `404 Not Found`
- Internal errors: message ẩn khỏi client, chỉ log server-side

## Exception Handler Pattern (OCP)

Để thêm exception type mới:
1. Tạo class implement `ExceptionHandler` interface trong `src/common/filters/exception-handlers/`
2. Đăng ký class vào `providers[]` trong `AppModule`
3. Thêm vào `EXCEPTION_HANDLERS` factory array với đúng thứ tự ưu tiên
4. Không cần sửa `GlobalExceptionFilter`

```typescript
// exception-handler.interface.ts
export interface ExceptionHandler {
  canHandle(exception: unknown): boolean;
  handle(exception: unknown, lang: string): Promise<ExceptionResult>;
}
```

## Validation Pattern

- `I18nValidationPipe` thay thế `ValidationPipe` default (đăng ký trong `main.ts`)
- Trả `422 UNPROCESSABLE_ENTITY` với `errors: Record<string, string[]>` per field
- Hỗ trợ nested DTO (vd: `address.city`)
- i18n keys: `validation.<constraintKey>` trong `i18n/en/validation.json` và `i18n/vi/validation.json`
- Flag `isValidationError: true` trong exception body để filter nhận diện

## Postgres Error Handling

- Dùng `POSTGRES_ERROR_CODES` constant từ `src/common/constants/postgres-error-codes.constant.ts`
- Dùng `isPostgresError()` type guard thay unsafe cast

## Logging & Tracing Pattern

- **LoggingInterceptor**: Được đăng ký globally (chạy trước ResponseInterceptor) để trace toàn bộ vòng đời của một HTTP Request. Ghi log Request IN, Request OUT, chậm (SLOW > 3s) và lỗi chưa bắt.
- **Correlation ID**: Mỗi request được cấp một `requestId` (UUID v4) thông qua ClsModule context. Log outputs được liên kết dựa trên `requestId` này.
- **Environment Log Levels**: `app.logLevel` cấu hình log level của ứng dụng (debug, log, warn, error). `NestFactory` được update dynamically ở `main.ts` để chặn log output tùy theo level thay vì chỉ dùng defaults. Mọi thành phần đều nên khởi tạo private logger: `private readonly logger = new Logger(ClassName.name);` và dùng logger framework chuẩn. Dọn dẹp `console.log` trong dự án.

