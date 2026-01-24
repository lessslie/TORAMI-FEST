import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsDateString, IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { GiveawayStatus } from '@prisma/client';

export class UpdateGiveawayDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;

  @ApiProperty({ required: false, enum: GiveawayStatus })
  @IsOptional()
  @IsEnum(GiveawayStatus)
  status?: GiveawayStatus;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  winner?: string;
}
