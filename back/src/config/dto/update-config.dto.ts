import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsString, IsArray, IsOptional, IsInt, Min } from 'class-validator';

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

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  donationTitle?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  donationDescription?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  donationImage?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  donationGoal?: number;

  @ApiProperty({ required: false, description: 'Límite de cupos para el concurso de cosplay' })
  @IsOptional()
  @IsInt()
  @Min(1)
  cosplayLimit?: number;

  @ApiProperty({ required: false, description: 'Límite de cupos para cosplay invitados' })
  @IsOptional()
  @IsInt()
  @Min(1)
  cosplayGuestLimit?: number;

  @ApiProperty({ required: false, description: 'Límite de cupos para karaoke' })
  @IsOptional()
  @IsInt()
  @Min(1)
  karaokeLimit?: number;

  @ApiProperty({ required: false, description: 'Inscripciones de cosplay abiertas' })
  @IsOptional()
  @IsBoolean()
  cosplayInscripcionesAbiertas?: boolean;

  @ApiProperty({ required: false, description: 'Inscripciones de cosplay invitados abiertas' })
  @IsOptional()
  @IsBoolean()
  cosplayGuestInscripcionesAbiertas?: boolean;

  @ApiProperty({ required: false, description: 'Inscripciones de stands abiertas' })
  @IsOptional()
  @IsBoolean()
  standsInscripcionesAbiertas?: boolean;

  @ApiProperty({ required: false, description: 'Inscripciones de karaoke abiertas' })
  @IsOptional()
  @IsBoolean()
  karaokeInscripcionesAbiertas?: boolean;

  @ApiProperty({ required: false, description: 'Inscripciones de sorteos abiertas' })
  @IsOptional()
  @IsBoolean()
  giveawaysInscripcionesAbiertas?: boolean;
}
