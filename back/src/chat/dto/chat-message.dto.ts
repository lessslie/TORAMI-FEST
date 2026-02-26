import { ArrayMaxSize, IsArray, IsNotEmpty, IsString, MaxLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class MessageDto {
  @IsString()
  @IsNotEmpty()
  role!: 'user' | 'model';

  @IsString()
  @IsNotEmpty()
  @MaxLength(2000, { message: 'El mensaje no puede superar 2000 caracteres' })
  text!: string;
}

export class ChatMessageDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000, { message: 'El mensaje no puede superar 2000 caracteres' })
  message!: string;

  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => MessageDto)
  history!: MessageDto[];
}
