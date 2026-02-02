import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, Res, UseGuards, ForbiddenException } from '@nestjs/common';
import { Response } from 'express';
import PDFDocument from 'pdfkit';
import { StandsService } from './stands.service';
import { CreateStandDto } from './dto/create-stand.dto';
import { UpdateStandStatusDto } from './dto/update-stand-status.dto';
import { AddMessageDto } from './dto/add-message.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { UserRole } from '@prisma/client';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('stands')
@Controller('stands')
export class StandsController {
  constructor(private readonly standsService: StandsService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('includeMessages') includeMessages?: string
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    const includeMessagesFlag = includeMessages === 'true';
    return this.standsService.findAll(pageNum, limitNum, status, includeMessagesFlag);
  }

  // Admin: Descargar lista de stands en PDF
  // IMPORTANTE: Esta ruta debe estar ANTES de :id para evitar conflictos
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Get('download/pdf')
  async downloadPdf(@Res() res: Response) {
    const stands = await this.standsService.findAllForExport();

    const filename = `stands-${new Date().toISOString().split('T')[0]}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'landscape' });
    doc.pipe(res);

    // Título
    doc.fontSize(18).font('Helvetica-Bold').text('Lista de Stands', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica').text(`Generado: ${new Date().toLocaleString('es-AR')}`, { align: 'center' });
    doc.moveDown(1);

    // Tabla
    const headers = ['#', 'Marca/Nombre', 'Tipo', 'Estado', 'Contacto', 'Email', 'Teléfono', 'Evento'];
    const colWidths = [25, 120, 70, 70, 100, 130, 80, 120];
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
    stands.forEach((s, index) => {
      if (y > 550) {
        doc.addPage();
        y = 30;
      }
      x = startX;
      const row = [
        String(index + 1),
        s.brandName || '-',
        s.type || '-',
        s.status || '-',
        s.contactName || '-',
        s.email || '-',
        s.phone || '-',
        s.event?.title || '-',
      ];
      row.forEach((cell, i) => {
        doc.text(String(cell).substring(0, 25), x, y, { width: colWidths[i], align: 'left' });
        x += colWidths[i];
      });
      y += 12;
    });

    doc.end();
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.standsService.findOne(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('user/:userId')
  findByUser(@Param('userId') userId: string, @Req() req: any) {
    // Solo el propio usuario o admins pueden ver los stands de un usuario
    if (req.user.userId !== userId && req.user.role === UserRole.USER) {
      throw new ForbiddenException('No tienes permiso para ver estos datos');
    }
    return this.standsService.findByUser(userId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Req() req: any, @Body() dto: CreateStandDto) {
    return this.standsService.create(req.user.userId, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateStandStatusDto) {
    return this.standsService.updateStatus(id, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post(':id/messages')
  addMessage(@Param('id') id: string, @Req() req: any, @Body() dto: AddMessageDto) {
    return this.standsService.addMessage(id, dto, req.user.userId, req.user.role);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.standsService.delete(id);
  }
}
