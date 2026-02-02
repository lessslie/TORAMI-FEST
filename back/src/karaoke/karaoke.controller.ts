import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Res,
  UseGuards,
  Request,
} from '@nestjs/common';
import { Response } from 'express';
import PDFDocument from 'pdfkit';
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

  // Admin: Descargar lista de karaoke en PDF
  // IMPORTANTE: Esta ruta debe estar ANTES de :id para evitar conflictos
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Get('download/pdf')
  async downloadPdf(@Res() res: Response) {
    const registrations = await this.karaokeService.findAllForExport();

    const filename = `karaoke-${new Date().toISOString().split('T')[0]}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'landscape' });
    doc.pipe(res);

    // Título
    doc.fontSize(18).font('Helvetica-Bold').text('Lista de Karaoke', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica').text(`Generado: ${new Date().toLocaleString('es-AR')}`, { align: 'center' });
    doc.moveDown(1);

    // Tabla
    const headers = ['#', 'Nombre', 'Email', 'WhatsApp', 'Canción 1', 'Canción 2', 'Canción 3', 'Estado'];
    const colWidths = [30, 100, 120, 80, 120, 100, 100, 60];
    const startX = 30;
    let y = doc.y;

    // Header row
    doc.font('Helvetica-Bold').fontSize(8);
    let x = startX;
    headers.forEach((header, i) => {
      doc.text(header, x, y, { width: colWidths[i], align: 'left' });
      x += colWidths[i];
    });
    y += 15;
    doc.moveTo(startX, y).lineTo(startX + colWidths.reduce((a, b) => a + b, 0), y).stroke();
    y += 5;

    // Data rows
    doc.font('Helvetica').fontSize(7);
    registrations.forEach((r) => {
      if (y > 550) {
        doc.addPage();
        y = 30;
      }
      x = startX;
      const row = [
        String(r.assignedNumber || '-'),
        r.fullName || '-',
        r.email || '-',
        r.whatsapp || '-',
        r.songName || '-',
        r.songName2 || '-',
        r.songName3 || '-',
        r.status || '-',
      ];
      row.forEach((cell, i) => {
        doc.text(String(cell).substring(0, 25), x, y, { width: colWidths[i], align: 'left' });
        x += colWidths[i];
      });
      y += 12;
    });

    doc.end();
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
