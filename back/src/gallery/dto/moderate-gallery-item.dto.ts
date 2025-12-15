import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { GalleryStatus } from '@prisma/client';

export class ModerateGalleryItemDto {
  @ApiProperty({ enum: GalleryStatus })
  @IsEnum(GalleryStatus)
  status!: GalleryStatus;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  feedback?: string;
}
