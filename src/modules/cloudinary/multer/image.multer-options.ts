import { UnprocessableEntityException } from '@nestjs/common';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { memoryStorage } from 'multer';
import { CLOUDINARY_LIMITS } from '../constants/cloudinary.constants';

export const imageMulterOptions: MulterOptions = {
  storage: memoryStorage(),
  limits: {
    fileSize: CLOUDINARY_LIMITS.IMAGE_MAX_SIZE,
  },
  fileFilter: (req, file, callback) => {
    if (
      (CLOUDINARY_LIMITS.ALLOWED_IMAGE_MIMETYPES as readonly string[]).includes(
        file.mimetype,
      )
    ) {
      callback(null, true);
    } else {
      callback(
        new UnprocessableEntityException('common.errors.validation'),
        false,
      );
    }
  },
};
