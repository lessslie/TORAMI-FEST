import { IsEmail, IsOptional, IsString, MinLength, IsInt, Min } from 'class-validator';

export class RegisterDto {
  @IsString()
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsOptional()
  @IsInt()
  @Min(13)
  age?: number;

  @IsOptional()
  @IsString()
  phone?: string;
}
