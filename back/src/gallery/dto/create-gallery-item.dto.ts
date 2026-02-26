import { ApiProperty } from '@nestjs/swagger';
import { IsUrl, IsString, IsOptional, IsNotEmpty } from 'class-validator';

export class CreateGalleryItemDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  eventId?: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsUrl({ require_tld: true, protocols: ['https'] })
  url!: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  description!: string;
}
