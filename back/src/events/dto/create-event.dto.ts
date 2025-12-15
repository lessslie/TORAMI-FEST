import { IsArray, IsBoolean, IsISO8601, IsOptional, IsString, IsNumber, IsUrl } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateEventDto {
  @IsString()
  title!: string;

  @IsISO8601()
  date!: string;

  @IsString()
  time!: string;

  @IsString()
  location!: string;

  @IsString()
  description!: string;

  @IsOptional()
  @IsBoolean()
  isPast?: boolean;

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @IsOptional()
  @IsBoolean()
  rainCheck?: boolean;

  @IsOptional()
  @IsArray()
  images?: string[];

  @IsOptional()
  @IsArray()
  tags?: string[];

  @IsOptional()
  @IsBoolean()
  isFree?: boolean;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  ticketPrice?: number;

  @IsOptional()
  @IsUrl()
  ticketLink?: string;
}
