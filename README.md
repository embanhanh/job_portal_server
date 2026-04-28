# Job Portal Server

High-performance recruitment system backend built with **NestJS v11+**, following Modular Monolith architecture with DDD principles.

## Tech Stack

| Technology | Version | Purpose |
|-----------|---------|---------|
| NestJS | v11+ | Core framework |
| TypeORM | v0.3.x | ORM (PostgreSQL) |
| PostgreSQL | v16+ | Primary database (Neon.tech) |
| Elasticsearch | v8.x | Full-text job search |
| Redis | v7+ | Cache & queue backend |
| BullMQ | v5+ | Background job processing |
| Cloudinary | SDK v2 | CV/file storage |
| Passport.js | Latest | Authentication (JWT, Google, Facebook) |
| nestjs-i18n | v10.x | Internationalization (vi/en) |
| Firebase Admin | v12+ | Realtime notifications |
| Swagger | v8+ | API documentation |

## Architecture

```
Controller → Service → Repository
     ↓           ↓
  Swagger    EventEmitter2 → BullMQ (background jobs)
```

- **Modular Monolith** with clear domain boundaries
- **Generic Repository Pattern** — `BaseRepository<T>` with CRUD + pagination
- **Service Layer** — `BaseService<T>` inheriting from repository
- **Event-Driven** — Domain events trigger Elasticsearch sync
- **RBAC** — Role-based access control (admin, employer, candidate)

## Project Structure

```
src/
├── config/                    # Typed configuration modules
├── common/                    # Shared infrastructure
│   ├── base/                  # BaseEntity, BaseRepository, BaseService
│   ├── dto/                   # PaginationDto
│   ├── interfaces/            # Response types, AuthenticatedRequest
│   ├── interceptors/          # ResponseInterceptor (unified wrapper)
│   ├── filters/               # GlobalExceptionFilter (i18n errors)
│   ├── decorators/            # @Roles(), @ApiPaginatedResponse()
│   └── guards/                # RolesGuard
├── modules/
│   ├── auth/                  # JWT + OAuth2 (Google, Facebook)
│   ├── job/                   # CRUD + Elasticsearch sync
│   └── application/           # Job applying + Cloudinary + BullMQ scoring
└── i18n/                      # vi/en translation files
```

## Getting Started

### Prerequisites

- Node.js v22+
- PostgreSQL (or [Neon.tech](https://neon.tech) account)
- Redis v7+
- Elasticsearch v8.x (optional, for search)

### Installation

```bash
# Clone and install
cd job_portal_server
npm install

# Configure environment
cp .env.example .env
# Edit .env with your actual credentials
```

### Development

```bash
npm run start:dev
```

Server starts at `http://localhost:3000`

### API Documentation

Swagger UI available at: `http://localhost:3000/api/docs`

## API Endpoints

### Auth (`/api/v1/auth`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/register` | Register new user | Public |
| POST | `/login` | Login with email/password | Public |
| POST | `/logout` | Logout | JWT |
| GET | `/google` | Google OAuth2 login | Public |
| GET | `/facebook` | Facebook OAuth2 login | Public |

### Jobs (`/api/v1/jobs`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/` | List published jobs (paginated) | Public |
| GET | `/search?q=keyword` | Full-text search via Elasticsearch | Public |
| GET | `/:id` | Get job details | Public |
| POST | `/` | Create job | Employer/Admin |
| PATCH | `/:id` | Update job | Employer/Admin |
| PATCH | `/:id/publish` | Publish job | Employer/Admin |
| DELETE | `/:id` | Soft-delete job | Employer/Admin |

### Applications (`/api/v1/applications`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/` | Apply for a job (with CV upload) | Candidate |
| GET | `/my` | My applications | Candidate |
| GET | `/job/:jobId` | Applications for a job | Employer/Admin |
| GET | `/:id` | Application details | JWT |

## Key Features

### Unified Response Format

All responses follow a standardized structure:

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "page": 1,
    "limit": 10,
    "totalItems": 100,
    "totalPages": 10,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

### i18n (JSONB)

Dynamic content stored as JSONB with language keys:

```json
{
  "title": { "vi": "Lập trình viên NestJS", "en": "NestJS Developer" },
  "description": { "vi": "Mô tả công việc...", "en": "Job description..." }
}
```

Use `?lang=vi` or `Accept-Language: vi` header to get localized responses.

### Security

- **Helmet** — HTTP security headers
- **Rate Limiting** — ThrottlerModule with Redis
- **RBAC** — `@Roles()` decorator + `RolesGuard`
- **JWT** — Bearer token authentication
- **Input Validation** — class-validator on all DTOs

## Coding Standards

This project enforces strict coding rules defined in `AGENTS.md`:

- **No `any`** — All types must be explicit
- **DTO validation** — class-validator on all inputs
- **Swagger docs** — All endpoints documented
- **SOLID & DRY** — Clean, maintainable code
- **kebab-case** files, **PascalCase** classes, **camelCase** variables

## Context System

Project uses a `.context/` directory for tracking state:

- `.context/activeContext.md` — Current task & working state
- `.context/progress.md` — Overall project progress
- `.context/systemPatterns.md` — Architecture decisions & patterns

## License

MIT
