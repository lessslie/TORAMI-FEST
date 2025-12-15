import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class ValidateStampDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  code!: string;
}
