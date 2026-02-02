import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, Res, UseGuards, ForbiddenException } from '@nestjs/common';
import { Response } from 'express';
import PDFDocument from 'pdfkit';
import { CosplayService } from './cosplay.service';
import { CreateCosplayDto } from './dto/create-cosplay.dto';
import { UpdateCosplayStatusDto } from './dto/update-cosplay-status.dto';
import { CosplayAddMessageDto } from './dto/add-message.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { UserRole } from '@prisma/client';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('cosplay')
@Controller('cosplay')
export class CosplayController {
  constructor(private readonly cosplayService: CosplayService) {}

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
    return this.cosplayService.findAll(pageNum, limitNum, status, includeMessagesFlag);
  }

  /**
   * Get available slots for cosplay registration
   * IMPORTANT: Must be before :id route to avoid matching as an ID
   */
  @Get('available-slots')
  async getAvailableSlots() {
    const available = await this.cosplayService.getAvailableSlots();
    const limit = await this.cosplayService.getCosplayLimit();
    return {
      available,
      limit,
      occupied: limit - available,
    };
  }

  // Admin: Descargar lista de cosplay concurso en PDF
  // IMPORTANTE: Esta ruta debe estar ANTES de :id para evitar conflictos
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Get('download/pdf')
  async downloadPdf(@Res() res: Response) {
    const registrations = await this.cosplayService.findAllForExport();

    const filename = `cosplay-concurso-${new Date().toISOString().split('T')[0]}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'landscape' });
    doc.pipe(res);

    // Título
    doc.fontSize(18).font('Helvetica-Bold').text('Lista de Cosplay Concurso', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica').text(`Generado: ${new Date().toLocaleString('es-AR')}`, { align: 'center' });
    doc.moveDown(1);

    // Tabla
    const headers = ['#', 'Participante', 'Nickname', 'WhatsApp', 'Personaje', 'Serie', 'Categoría', 'Estado'];
    const colWidths = [25, 110, 80, 90, 110, 110, 80, 70];
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
    registrations.forEach((r, index) => {
      if (y > 550) {
        doc.addPage();
        y = 30;
      }
      x = startX;
      const row = [
        String(index + 1),
        r.participantName || '-',
        r.nickname || '-',
        r.whatsapp || '-',
        r.characterName || '-',
        r.seriesName || '-',
        r.category || '-',
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

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.cosplayService.findOne(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('user/:userId')
  findByUser(@Param('userId') userId: string, @Req() req: any) {
    // Solo el propio usuario o admins pueden ver los registros
    if (req.user.userId !== userId && req.user.role === UserRole.USER) {
      throw new ForbiddenException('No tienes permiso para ver estos datos');
    }
    return this.cosplayService.findByUser(userId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Req() req: any, @Body() dto: CreateCosplayDto) {
    return this.cosplayService.create(req.user.userId, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateCosplayStatusDto) {
    return this.cosplayService.updateStatus(id, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post(':id/messages')
  addMessage(@Param('id') id: string, @Req() req: any, @Body() dto: CosplayAddMessageDto) {
    return this.cosplayService.addMessage(id, dto, req.user.userId, req.user.role);
  }

  /**
   * Add user to waiting list
   */
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('waiting-list')
  addToWaitingList(@Req() req: any, @Body() dto: CreateCosplayDto) {
    return this.cosplayService.addToWaitingList(req.user.userId, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.cosplayService.delete(id);
  }
}
