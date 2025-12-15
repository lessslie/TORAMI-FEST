import { IsOptional, IsString } from 'class-validator';

export class AddMessageDto {
  @IsString()
  text!: string;

  @IsString()
  sender!: 'ADMIN' | 'USER';

  @IsOptional()
  @IsString()
  imageUrl?: string;
}
