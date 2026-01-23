import { IsString, IsNotEmpty, IsEmail, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

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

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  eventId!: string;
}
