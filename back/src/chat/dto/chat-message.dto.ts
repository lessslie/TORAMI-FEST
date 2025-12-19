import { IsArray, IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class MessageDto {
  @IsString()
  @IsNotEmpty()
  role: 'user' | 'model';

  @IsString()
  @IsNotEmpty()
  text: string;
}

export class ChatMessageDto {
  @IsString()
  @IsNotEmpty()
  message: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MessageDto)
  history: MessageDto[];
}
