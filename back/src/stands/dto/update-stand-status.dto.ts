import { IsEnum } from 'class-validator';
import { StandStatus } from '@prisma/client';

export class UpdateStandStatusDto {
  @IsEnum(StandStatus)
  status!: StandStatus;
}
