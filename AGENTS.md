# AGENTS.md

## 1. Project Overview

NestJS recruitment backend:

- i18n (nestjs-i18n)
- Elasticsearch (search)
- BullMQ (background jobs)
- PostgreSQL (JSONB fields)

---

## 2. Core Architecture

- Controller → Service → Repository
- Controller: no business logic
- Service: contains all logic
- No direct DB access from controllers

---

## 3. Coding Rules (MANDATORY)

- No `any`
- Use DTO for all inputs
- Validate using class-validator
- Follow SOLID & DRY
- Use async/await
- Handle errors properly

Naming:

- PascalCase (class)
- kebab-case (file)
- camelCase (variables)

---

## 4. i18n & Database

- JSONB fields must be localized before returning
- Always use `Accept-Language`
- Use transactions for multi-step operations

---

## 5. API & Error Handling

- Do NOT format response manually
- Use TransformInterceptor

- Throw exceptions in services:
  - BadRequestException
  - NotFoundException

- GlobalExceptionFilter handles errors

---

## 6. Background Jobs

Use BullMQ for:

- Email
- AI scoring
- Image processing
- Elasticsearch sync

---

## 7. Security

- Use RolesGuard
- Validate all input
- Sanitize data

---

## 8. Elasticsearch

- Keep ES in sync with DB
- Use background jobs
- Avoid DB search queries

---

## 9. Context System (CRITICAL)

Project uses a minimal context system:

.context/

- activeContext.md
- progress.md
- systemPatterns.md

### Purpose

- activeContext.md → current task & working state
- progress.md → overall project progress
- systemPatterns.md → architecture, rules, decisions

---

## 10. Agent Workflow (MANDATORY)

### Step 1: Read Context

Before coding, ALWAYS read:

- AGENTS.md
- .context/activeContext.md
- .context/progress.md
- .context/systemPatterns.md

---

### Step 2: Planning (REQUIRED)

- Explain approach before writing code
- Ensure alignment with systemPatterns

---

### Step 3: Implementation

- Follow all coding rules
- Respect architecture boundaries
- Do not violate systemPatterns

---

### Step 4: Update Context (REQUIRED)

After completing a task:

#### Update activeContext.md

- Mark completed tasks
- Adjust next steps

#### Update progress.md

- Update module/feature progress

#### Update systemPatterns.md (if needed)

- Add new decisions
- Add new reusable patterns

---

## 11. Context Priority (IMPORTANT)

If conflict occurs:

1. .context/systemPatterns.md
2. AGENTS.md
3. Existing codebase

---

## 12. Constraints

- Do NOT add new libraries without justification
- Do NOT break module structure
- Do NOT ignore systemPatterns
- Prefer consistency over optimization

---

## 13. Definition of Done

Task is complete when:

- Code compiles
- Follows all rules
- Uses DTO + validation
- Has Swagger docs
- Errors handled correctly
- Context updated (.context files)

---

## 14. Agent Behavior Rules

- Always read context before coding
- Never guess missing requirements → check context
- Keep solutions simple and maintainable
- Reuse existing patterns when possible
- If new pattern is introduced → store in systemPatterns.md
