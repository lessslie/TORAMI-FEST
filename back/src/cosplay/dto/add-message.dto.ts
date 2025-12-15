import { IsOptional, IsString } from 'class-validator';

export class CosplayAddMessageDto {
  @IsString()
  text!: string;

  @IsString()
  sender!: 'ADMIN' | 'USER';

  @IsOptional()
  @IsString()
  imageUrl?: string;
}
