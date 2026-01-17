import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards, ForbiddenException } from '@nestjs/common';
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
