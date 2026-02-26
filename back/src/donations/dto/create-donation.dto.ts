import { IsBoolean, IsDecimal, IsEmail, IsOptional, IsPositive, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDonationDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  donorName?: string;

  @ApiProperty()
  @IsEmail()
  donorEmail!: string;

  @ApiProperty()
  @IsDecimal()
  @IsPositive()
  amount!: number;

  @ApiProperty({ required: false, default: false })
  @IsOptional()
  @IsBoolean()
  isAnonymous?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  message?: string;
}
