# Active Context

## Current Task

- **COMPLETED** — Create Cloudinary Module for file uploads (avatars, logos, resumes).

## Completed

- [x] Create `cloudinary.constants.ts` and `cloudinary.types.ts`.
- [x] Implement `CloudinaryProvider` using `ConfigService`.
- [x] Implement `CloudinaryService` with `uploadFile` (via `streamifier`) and `deleteFile`.
- [x] Set up Multer options for images (`image.multer-options.ts`) and PDFs (`pdf.multer-options.ts`) with custom size limits and mimetype filtering.
- [x] Create `CloudinaryModule` to wrap provider and service.
- [x] Refactored i18n Architecture and GlobalExceptionFilter.

## Next Steps

- [ ] Add unit tests for Cloudinary Service.
- [x] Connect Frontend file upload forms to backend endpoints utilizing this Cloudinary service.
- [x] Refactor old Application/Cloudinary usages to use the new `CloudinaryModule` globally.
