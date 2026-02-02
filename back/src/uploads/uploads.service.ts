import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { Readable } from 'stream';
import * as path from 'path';

@Injectable()
export class UploadsService {
  constructor(private readonly config: ConfigService) {
    cloudinary.config({
      cloud_name: this.config.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: this.config.get<string>('CLOUDINARY_API_KEY'),
      api_secret: this.config.get<string>('CLOUDINARY_API_SECRET'),
      secure: true,
    });
  }

  async uploadBuffer(
    file: any,
    folder = 'torami',
    resourceType: 'image' | 'video' | 'raw' | 'auto' = 'auto',
  ) {
    // Opciones base de subida
    const options: any = {
      folder,
      resource_type: resourceType,
      access_mode: 'public', // Asegurar acceso público
    };

    // Si es un archivo raw y tiene nombre original, usamos el nombre con extensión
    if (resourceType === 'raw' && file.originalname) {
      const ext = path.extname(file.originalname);
      const baseName = path.basename(file.originalname, ext);
      // Generar un ID único pero preservando la extensión
      const uniqueId = `${baseName}_${Date.now()}${ext}`;
      options.public_id = uniqueId;
    }

    return new Promise<UploadApiResponse>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
        if (error || !result) return reject(error || new Error('Upload failed'));
        resolve(result);
      });

      Readable.from(file.buffer).pipe(stream);
    }).catch((err) => {
      throw new InternalServerErrorException(err?.message || 'Cloudinary upload failed');
    });
  }
}
