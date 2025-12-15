import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsString, IsArray, IsOptional } from 'class-validator';

export class UpdateConfigDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  donationsEnabled?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  paymentLink?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  aliasCbu?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  qrImage?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  heroTitle?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  heroSubtitle?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  heroDateText?: string;

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  homeGalleryImages?: string[];
}
