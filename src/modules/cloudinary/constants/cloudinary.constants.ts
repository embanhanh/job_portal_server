export const CLOUDINARY = 'CLOUDINARY';

export const CLOUDINARY_FOLDERS = {
  AVATARS: 'avatars',
  COMPANY_LOGOS: 'company-logos',
  COMPANY_DOCS: 'company-docs',
  RESUMES: 'resumes',
} as const;

export const CLOUDINARY_LIMITS = {
  IMAGE_MAX_SIZE: 5 * 1024 * 1024, // 5MB
  PDF_MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_IMAGE_MIMETYPES: ['image/jpeg', 'image/png', 'image/webp'],
  ALLOWED_PDF_MIMETYPE: 'application/pdf',
} as const;
