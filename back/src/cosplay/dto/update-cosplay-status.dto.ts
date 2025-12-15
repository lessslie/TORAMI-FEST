import { IsEnum } from 'class-validator';
import { CosplayStatus } from '@prisma/client';

export class UpdateCosplayStatusDto {
  @IsEnum(CosplayStatus)
  status!: CosplayStatus;
}
