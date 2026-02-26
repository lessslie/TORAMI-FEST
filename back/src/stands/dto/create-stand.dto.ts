import { ArrayNotEmpty, IsArray, IsEmail, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class CreateStandDto {
  @IsString()
  @MaxLength(100, { message: 'El nombre de marca no puede superar 100 caracteres' })
  brandName!: string;

  @IsString()
  @MaxLength(50)
  type!: string;

  @IsString()
  @MaxLength(100, { message: 'El nombre de contacto no puede superar 100 caracteres' })
  contactName!: string;

  @IsEmail({}, { message: 'El email no es válido' })
  email!: string;

  @IsString()
  @MaxLength(20)
  @Matches(/^[\d\s\-+()]+$/, { message: 'El número de WhatsApp solo puede contener números, espacios, guiones y el signo +' })
  phone!: string;

  @IsString()
  @MaxLength(200)
  socials!: string;

  @IsString()
  @MaxLength(1000, { message: 'La descripción no puede superar 1000 caracteres' })
  description!: string;

  @IsString()
  @MaxLength(500)
  needs!: string;

  @IsArray()
  @ArrayNotEmpty()
  images?: string[];

  @IsOptional()
  @IsString()
  eventId?: string;
}
