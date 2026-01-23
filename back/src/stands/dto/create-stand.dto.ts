import { ArrayNotEmpty, IsArray, IsEmail, IsOptional, IsString, Matches } from 'class-validator';

export class CreateStandDto {
  @IsString()
  brandName!: string;

  @IsString()
  type!: string;

  @IsString()
  contactName!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @Matches(/^[\d\s\-+()]+$/, { message: 'El número de WhatsApp solo puede contener números, espacios, guiones y el signo +' })
  phone!: string;

  @IsString()
  socials!: string;

  @IsString()
  description!: string;

  @IsString()
  needs!: string;

  @IsArray()
  @ArrayNotEmpty()
  images?: string[];

  @IsOptional()
  @IsString()
  eventId?: string;
}
