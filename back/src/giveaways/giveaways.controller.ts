import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Request,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { GiveawaysService } from './giveaways.service';
import { CreateGiveawayDto } from './dto/create-giveaway.dto';
import { UpdateGiveawayDto } from './dto/update-giveaway.dto';
import { CreateParticipantDto } from './dto/create-participant.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { Roles } from '../common/roles.decorator';
import { RolesGuard } from '../common/roles.guard';
import { UserRole } from '@prisma/client';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('giveaways')
@Controller('giveaways')
export class GiveawaysController {
  constructor(private readonly giveawaysService: GiveawaysService) {}

  // Público: Obtener sorteo activo actual
  @Get('active')
  findActive() {
    return this.giveawaysService.findActive();
  }

  // Admin: Obtener todos los sorteos
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Get()
  findAll() {
    return this.giveawaysService.findAll();
  }

  // Admin: Obtener un sorteo específico
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.giveawaysService.findOne(id);
  }

  // Admin: Crear sorteo
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Post()
  create(@Body() dto: CreateGiveawayDto) {
    return this.giveawaysService.create(dto);
  }

  // Admin: Actualizar sorteo
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateGiveawayDto) {
    return this.giveawaysService.update(id, dto);
  }

  // Admin: Eliminar sorteo
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.giveawaysService.delete(id);
  }

  // Público: Inscribirse a un sorteo (formulario)
  @UseGuards(OptionalJwtAuthGuard)
  @Post(':id/join')
  participate(
    @Param('id') id: string,
    @Body() dto: CreateParticipantDto,
    @Request() req,
  ) {
    const userId = req.user?.userId;
    return this.giveawaysService.participate(id, dto, userId);
  }

  // Público: Verificar si un DNI ya está inscripto
  @Get(':id/check-dni')
  checkDni(@Param('id') id: string, @Query('dni') dni: string) {
    return this.giveawaysService.checkDni(id, dni);
  }

  // Admin: Obtener participantes de un sorteo
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Get(':id/participants')
  getParticipants(@Param('id') id: string) {
    return this.giveawaysService.getParticipants(id);
  }

  // Admin: Descargar participantes en CSV
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Get(':id/participants/download')
  async downloadParticipants(@Param('id') id: string, @Res() res: Response) {
    const participants = await this.giveawaysService.getParticipants(id);
    const giveaway = await this.giveawaysService.findOne(id);

    // Crear CSV
    const headers = [
      'Nombre Completo',
      'Fecha de Nacimiento',
      'DNI',
      'WhatsApp',
      'Email',
      'Instagram',
      'Fecha de Inscripcion',
    ];

    const rows = participants.map((p) => [
      p.fullName,
      new Date(p.birthDate).toLocaleDateString('es-AR'),
      p.dni,
      p.whatsapp,
      p.email,
      p.instagram || '-',
      new Date(p.createdAt).toLocaleString('es-AR'),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    // Agregar BOM para Excel
    const bom = '\uFEFF';
    const csvWithBom = bom + csvContent;

    const filename = `participantes-${giveaway.title.replace(/[^a-zA-Z0-9]/g, '-')}-${new Date().toISOString().split('T')[0]}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csvWithBom);
  }

  // Usuario logueado: Mis sorteos
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('user/me')
  getUserGiveaways(@Request() req) {
    return this.giveawaysService.getUserGiveaways(req.user.userId);
  }
}
