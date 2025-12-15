import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNotEmpty } from 'class-validator';

export class CreateGalleryItemDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  eventId?: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  url!: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  description!: string;
}
