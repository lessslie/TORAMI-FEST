import { IsArray, IsEmail, IsOptional, IsString } from 'class-validator';

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
  phone!: string;

  @IsString()
  socials!: string;

  @IsString()
  description!: string;

  @IsString()
  needs!: string;

  @IsOptional()
  @IsArray()
  images?: string[];

  @IsOptional()
  @IsString()
  eventId?: string;
}
