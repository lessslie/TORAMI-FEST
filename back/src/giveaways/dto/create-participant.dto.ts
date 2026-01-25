import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsDateString, IsOptional, IsEmail } from 'class-validator';

export class CreateParticipantDto {
  @ApiProperty({ description: 'Nombre completo del participante' })
  @IsNotEmpty({ message: 'El nombre completo es obligatorio' })
  @IsString()
  fullName!: string;

  @ApiProperty({ description: 'Fecha de nacimiento' })
  @IsNotEmpty({ message: 'La fecha de nacimiento es obligatoria' })
  @IsDateString()
  birthDate!: string;

  @ApiProperty({ description: 'DNI del participante' })
  @IsNotEmpty({ message: 'El DNI es obligatorio' })
  @IsString()
  dni!: string;

  @ApiProperty({ description: 'Número de WhatsApp' })
  @IsNotEmpty({ message: 'El WhatsApp es obligatorio' })
  @IsString()
  whatsapp!: string;

  @ApiProperty({ description: 'Email del participante' })
  @IsNotEmpty({ message: 'El email es obligatorio' })
  @IsEmail({}, { message: 'El email debe ser válido' })
  email!: string;

  @ApiProperty({ description: 'Instagram (opcional)', required: false })
  @IsOptional()
  @IsString()
  instagram?: string;
}
