# System Patterns

## Architecture

- **Pattern**: Modular Monolith with DDD principles
- **Flow**: Controller → Service → Repository
- **Events**: EventEmitter2 for domain events, BullMQ for background processing
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
  "message": "Success",
  "data": {},
  "meta": { "page": 1, "limit": 10, "totalItems": 100, ... }
}
```

## i18n JSONB Pattern

- Store as `{ "vi": "...", "en": "..." }` in PostgreSQL JSONB columns
- Use `BaseService.mapLanguage()` to extract before returning
- Language resolved from `Accept-Language` header or `?lang=` query

## Background Jobs (BullMQ)

All heavy/async operations go through BullMQ:

- **application-scoring** queue: AI/ML candidate scoring
- **elasticsearch-sync** queue: Job indexing to Elasticsearch
- Email sending (future)
- Image processing (future)

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
- `GlobalExceptionFilter` catches all, localizes messages via nestjs-i18n
- TypeORM `QueryFailedError` mapped to `400 Bad Request`
- TypeORM `EntityNotFoundError` mapped to `404 Not Found`
