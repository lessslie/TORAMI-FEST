import { BadRequestException, Controller, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadsService } from './uploads.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiBearerAuth, ApiConsumes, ApiBody, ApiTags } from '@nestjs/swagger';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];
const ALLOWED_DOCUMENT_TYPES = ['application/pdf'];
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;  // 10MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB
const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024; // 10MB

const createFileFilter = (allowedTypes: string[]) =>
  (_req: any, file: Express.Multer.File, cb: (error: Error | null, accept: boolean) => void) => {
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new BadRequestException(`Tipo de archivo no permitido. Se aceptan: ${allowedTypes.join(', ')}`), false);
    }
  };

@ApiTags('uploads')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post('image')
  @UseInterceptors(FileInterceptor('file', {
    limits: { fileSize: MAX_IMAGE_SIZE },
    fileFilter: createFileFilter(ALLOWED_IMAGE_TYPES),
  }))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  uploadImage(@UploadedFile() file: any) {
    return this.uploadsService.uploadBuffer(file, 'torami/images', 'image');
  }

  @Post('video')
  @UseInterceptors(FileInterceptor('file', {
    limits: { fileSize: MAX_VIDEO_SIZE },
    fileFilter: createFileFilter(ALLOWED_VIDEO_TYPES),
  }))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  uploadVideo(@UploadedFile() file: any) {
    return this.uploadsService.uploadBuffer(file, 'torami/videos', 'video');
  }

  @Post('document')
  @UseInterceptors(FileInterceptor('file', {
    limits: { fileSize: MAX_DOCUMENT_SIZE },
    fileFilter: createFileFilter(ALLOWED_DOCUMENT_TYPES),
  }))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  uploadDocument(@UploadedFile() file: any) {
    return this.uploadsService.uploadBuffer(file, 'torami/documents', 'raw');
  }
}
