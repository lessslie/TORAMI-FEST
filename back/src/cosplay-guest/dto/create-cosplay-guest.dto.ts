import { IsString, IsOptional, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCosplayGuestDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  participantName: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  nickname: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  whatsapp: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  characterName: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  seriesName: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  referenceImage?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  audioLink?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  audioStartTime?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  audioEndTime?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  eventId: string;
}
