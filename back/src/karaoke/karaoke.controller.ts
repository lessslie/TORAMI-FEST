import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { KaraokeService } from './karaoke.service';
import { CreateKaraokeDto } from './dto/create-karaoke.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { UserRole, KaraokeStatus } from '@prisma/client';

@ApiTags('karaoke')
@Controller('karaoke')
export class KaraokeController {
  constructor(private readonly karaokeService: KaraokeService) {}

  // Admin: obtener todas las inscripciones
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Get()
  findAll(@Query('eventId') eventId?: string) {
    return this.karaokeService.findAll(eventId);
  }

  // Público: obtener cupos disponibles por evento
  @Get('slots/:eventId')
  getAvailableSlots(@Param('eventId') eventId: string) {
    return this.karaokeService.getAvailableSlots(eventId);
  }

  // Usuario autenticado: obtener mis inscripciones
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('user/me')
  findByUser(@Request() req) {
    return this.karaokeService.findByUser(req.user.userId);
  }

  // Admin: obtener una inscripción específica
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.karaokeService.findOne(id);
  }

  // Usuario autenticado: crear inscripción
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Request() req, @Body() dto: CreateKaraokeDto) {
    return this.karaokeService.create(req.user.userId, dto);
  }

  // Admin: actualizar estado
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body('status') status: KaraokeStatus) {
    return this.karaokeService.updateStatus(id, status);
  }

  // Admin: eliminar inscripción
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.karaokeService.delete(id);
  }

  // Usuario: cancelar su propia inscripción
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete(':id/withdraw')
  withdraw(@Param('id') id: string, @Request() req) {
    return this.karaokeService.withdraw(id, req.user.userId);
  }
}
