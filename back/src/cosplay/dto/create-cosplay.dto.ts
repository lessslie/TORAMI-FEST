import { IsEnum, IsOptional, IsString } from 'class-validator';
import { CosplayStatus } from '@prisma/client';

export class CreateCosplayDto {
  @IsString()
  participantName!: string;

  @IsString()
  nickname!: string;

  @IsString()
  whatsapp!: string;

  @IsString()
  characterName!: string;

  @IsString()
  seriesName!: string;

  @IsString()
  category!: string;

  @IsOptional()
  @IsString()
  referenceImage?: string;

  @IsOptional()
  @IsString()
  audioLink?: string;

  @IsOptional()
  @IsEnum(CosplayStatus)
  status?: CosplayStatus;
}
