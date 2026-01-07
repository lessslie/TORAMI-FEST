import { IsString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class WithdrawCosplayGuestDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  withdrawalReason?: string;
}
