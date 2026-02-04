import {
  Controller,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import PDFDocument from 'pdfkit';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../common/roles.decorator';
import { RolesGuard } from '../common/roles.guard';
import { UserRole } from '@prisma/client';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Get()
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.usersService.findAll(pageNum, limitNum);
  }

  // Ruta para exportar PDF - DEBE estar antes de :id
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Get('download/pdf')
  async downloadPdf(@Res() res: Response) {
    const users = await this.usersService.findAllForExport();

    const filename = `usuarios-${new Date().toISOString().split('T')[0]}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'landscape' });
    doc.pipe(res);

    // Título
    doc.fontSize(18).font('Helvetica-Bold').text('Lista de Usuarios', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica').text(`Generado: ${new Date().toLocaleString('es-AR')}`, { align: 'center' });
    doc.moveDown(1);

    // Tabla
    const headers = ['#', 'Nombre', 'Email', 'Rol', 'WhatsApp', 'Teléfono', 'Entrada', 'Tipo Ticket', 'Registro'];
    const colWidths = [25, 100, 140, 70, 80, 80, 50, 70, 80];
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
    users.forEach((u, index) => {
      if (y > 550) {
        doc.addPage();
        y = 30;
      }
      x = startX;
      const row = [
        String(index + 1),
        u.name || '-',
        u.email || '-',
        u.role || '-',
        u.whatsapp || '-',
        u.phone || '-',
        u.entryAuthorized ? 'Sí' : 'No',
        u.ticketType || '-',
        u.createdAt ? new Date(u.createdAt).toLocaleDateString('es-AR') : '-',
      ];
      row.forEach((cell, i) => {
        doc.text(String(cell).substring(0, 30), x, y, { width: colWidths[i], align: 'left' });
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
  async findOne(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() data: Partial<{ name: string; email: string; whatsapp: string; phone: string; role: UserRole; entryAuthorized: boolean }>,
  ) {
    return this.usersService.updateUser(id, data);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.usersService.deleteUser(id);
  }
}
