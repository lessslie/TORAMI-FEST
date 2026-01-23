import { IsString, IsNotEmpty, IsEmail, Matches, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateKaraokeDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  fullName!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  instagram!: string;

  @ApiProperty()
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Matches(/^[\d\s\-+()]+$/, { message: 'El número de WhatsApp solo puede contener números, espacios, guiones y el signo +' })
  whatsapp!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  songName!: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  songName2?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  songName3?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  eventId!: string;
}
