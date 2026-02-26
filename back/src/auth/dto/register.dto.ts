import { IsEmail, IsInt, IsOptional, IsString, Matches, MaxLength, Min, MinLength } from 'class-validator';

export class RegisterDto {
  @IsString()
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
  @MaxLength(100, { message: 'El nombre no puede superar 100 caracteres' })
  name!: string;

  @IsEmail({}, { message: 'El email no es válido' })
  email!: string;

  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  @MaxLength(100, { message: 'La contraseña no puede superar 100 caracteres' })
  @Matches(/^(?=.*[A-Z])(?=.*[^A-Za-z0-9])/, {
    message: 'La contraseña debe contener al menos 1 letra mayúscula y 1 carácter especial',
  })
  password!: string;

  @IsOptional()
  @IsInt()
  @Min(13)
  age?: number;

  @IsOptional()
  @IsString()
  @MaxLength(20, { message: 'El teléfono no puede superar 20 caracteres' })
  @Matches(/^[\d\s\-+()]*$/, { message: 'El teléfono solo puede contener números, espacios, guiones y el signo +' })
  phone?: string;
}
