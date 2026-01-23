import { IsEnum, IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';
import { CosplayStatus } from '@prisma/client';

export class CreateCosplayDto {
  @IsString()
  participantName!: string;

  @IsString()
  nickname!: string;

  @IsString()
  @Matches(/^[\d\s\-+()]+$/, { message: 'El número de WhatsApp solo puede contener números, espacios, guiones y el signo +' })
  whatsapp!: string;

  @IsOptional()
  @IsString()
  instagram?: string;

  @IsOptional()
  @IsString()
  website?: string;

  @IsString()
  characterName!: string;

  @IsString()
  seriesName!: string;

  @IsString()
  category!: string;

  @IsString()
  @IsNotEmpty()
  referenceImage!: string;

  @IsOptional()
  @IsString()
  audioLink?: string;

  @IsOptional()
  @IsString()
  audioStartTime?: string;

  @IsOptional()
  @IsString()
  audioEndTime?: string;

  @IsOptional()
  @IsString()
  eventId?: string;

  @IsOptional()
  @IsEnum(CosplayStatus)
  status?: CosplayStatus;
}
