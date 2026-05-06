import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import * as streamifier from 'streamifier';
import { CloudinaryFolder, UploadResult } from './types/cloudinary.types';
import { CLOUDINARY_FOLDERS } from './constants/cloudinary.constants';

@Injectable()
export class CloudinaryService {
  async uploadFile(
    file: Express.Multer.File,
    folder: CloudinaryFolder,
  ): Promise<UploadResult> {
    return new Promise((resolve, reject) => {
      const resourceType =
        folder === CLOUDINARY_FOLDERS.RESUMES ? 'raw' : 'image';

      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: folder,
          resource_type: resourceType,
        },
        (error, result) => {
          if (error) {
            reject(
              new InternalServerErrorException('common.errors.internalServer', {
                cause: error,
              }),
            );
          } else if (result) {
            resolve(this.mapToUploadResult(result));
          } else {
            reject(
              new InternalServerErrorException('common.errors.internalServer'),
            );
          }
        },
      );

      streamifier.createReadStream(file.buffer).pipe(uploadStream);
    });
  }

  async deleteFile(publicId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (error: unknown) {
      throw new InternalServerErrorException('common.errors.internalServer', {
        cause: error,
      });
    }
  }

  private mapToUploadResult(result: UploadApiResponse): UploadResult {
    return {
      url: result.secure_url || result.url,
      publicId: result.public_id,
      format: result.format,
      bytes: result.bytes,
      width: result.width,
      height: result.height,
    };
  }
}
