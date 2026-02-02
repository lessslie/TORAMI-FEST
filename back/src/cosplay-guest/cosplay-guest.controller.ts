import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import PDFDocument from 'pdfkit';
import { CosplayGuestService } from './cosplay-guest.service';
import { CreateCosplayGuestDto } from './dto/create-cosplay-guest.dto';
import { WithdrawCosplayGuestDto } from './dto/withdraw-cosplay-guest.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { UserRole, CosplayStatus } from '@prisma/client';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('cosplay-guest')
@Controller('cosplay-guest')
export class CosplayGuestController {
  constructor(private readonly cosplayGuestService: CosplayGuestService) {}

  // PROTEGIDO: Solo admins pueden ver todos los registros
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('includeMessages') includeMessages?: string,
  ) {
    const pageNumber = page ? Number(page) : 1;
    const limitNumber = limit ? Number(limit) : 20;
    const include = includeMessages === 'true' || includeMessages === '1';
    return this.cosplayGuestService.findAll(pageNumber, limitNumber, include);
  }

  // PÚBLICO: Los slots disponibles son info pública necesaria para el form
  @Get('slots')
  getAvailableSlots() {
    return this.cosplayGuestService.getAvailableSlots();
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('user/me')
  findByUser(@Request() req, @Query('includeMessages') includeMessages?: string) {
    const include = includeMessages === 'true' || includeMessages === '1';
    return this.cosplayGuestService.findByUser(req.user.userId, include);
  }

  // Admin: Descargar lista de cosplay invitados en PDF
  // IMPORTANTE: Esta ruta debe estar ANTES de :id para evitar conflictos
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Get('download/pdf')
  async downloadPdf(@Res() res: Response) {
    const guests = await this.cosplayGuestService.findAllForExport();

    const filename = `cosplay-invitados-${new Date().toISOString().split('T')[0]}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'landscape' });
    doc.pipe(res);

    // Título
    doc.fontSize(18).font('Helvetica-Bold').text('Lista de Cosplay Invitados', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica').text(`Generado: ${new Date().toLocaleString('es-AR')}`, { align: 'center' });
    doc.moveDown(1);

    // Tabla
    const headers = ['#', 'Participante', 'Nickname', 'WhatsApp', 'Instagram', 'Personaje', 'Serie', 'Estado'];
    const colWidths = [30, 110, 80, 90, 90, 110, 110, 70];
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
    guests.forEach((g) => {
      if (y > 550) {
        doc.addPage();
        y = 30;
      }
      x = startX;
      const row = [
        String(g.assignedNumber || '-'),
        g.participantName || '-',
        g.nickname || '-',
        g.whatsapp || '-',
        g.instagram || '-',
        g.characterName || '-',
        g.seriesName || '-',
        g.status || '-',
      ];
      row.forEach((cell, i) => {
        doc.text(String(cell).substring(0, 25), x, y, { width: colWidths[i], align: 'left' });
        x += colWidths[i];
      });
      y += 12;
    });

    doc.end();
  }

  // PROTEGIDO: Solo admins pueden ver detalles de cualquier registro
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.cosplayGuestService.findOne(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Request() req, @Body() dto: CreateCosplayGuestDto) {
    return this.cosplayGuestService.create(req.user.userId, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete(':id/withdraw')
  withdraw(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: WithdrawCosplayGuestDto,
  ) {
    return this.cosplayGuestService.withdraw(id, req.user.userId, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() body: { status: CosplayStatus }) {
    return this.cosplayGuestService.updateStatus(id, body.status);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.cosplayGuestService.delete(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post(':id/message')
  addMessage(@Param('id') id: string, @Body() message: any) {
    return this.cosplayGuestService.addMessage(id, message);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get(':id/messages')
  getMessages(@Param('id') id: string) {
    return this.cosplayGuestService.getMessages(id);
  }
}
