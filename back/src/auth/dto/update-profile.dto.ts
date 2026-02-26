import { IsEmail, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
  @MaxLength(100, { message: 'El nombre no puede superar 100 caracteres' })
  name?: string;

  @IsOptional()
  @IsEmail({}, { message: 'El email no es válido' })
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  avatar?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20, { message: 'El WhatsApp no puede superar 20 caracteres' })
  @Matches(/^[\d\s\-+()]*$/, { message: 'El WhatsApp solo puede contener números, espacios, guiones y el signo +' })
  whatsapp?: string;
}
