import { IsString, IsNotEmpty, IsEmail } from 'class-validator';
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
