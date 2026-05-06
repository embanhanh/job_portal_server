import { UnprocessableEntityException } from '@nestjs/common';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { memoryStorage } from 'multer';
import { CLOUDINARY_LIMITS } from '../constants/cloudinary.constants';

export const pdfMulterOptions: MulterOptions = {
  storage: memoryStorage(),
  limits: {
    fileSize: CLOUDINARY_LIMITS.PDF_MAX_SIZE,
  },
  fileFilter: (req, file, callback) => {
    if (file.mimetype === CLOUDINARY_LIMITS.ALLOWED_PDF_MIMETYPE) {
      callback(null, true);
    } else {
      callback(
        new UnprocessableEntityException('common.errors.validation'),
        false,
      );
    }
  },
};
