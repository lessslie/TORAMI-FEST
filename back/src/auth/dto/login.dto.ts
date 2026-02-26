import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'El email no es válido' })
  email!: string;

  @IsString()
  @MinLength(6)
  @MaxLength(100)
  password!: string;
}
