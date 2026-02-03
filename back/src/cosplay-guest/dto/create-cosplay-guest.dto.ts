import { IsString, IsOptional, IsNotEmpty, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCosplayGuestDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  participantName!: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  nickname?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Matches(/^[\d\s\-+()]+$/, { message: 'El número de WhatsApp solo puede contener números, espacios, guiones y el signo +' })
  whatsapp!: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  instagram?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  website?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  characterName!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  seriesName!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  category!: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  referenceImage?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  eventId!: string;
}
