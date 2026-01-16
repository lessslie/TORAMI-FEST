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
  UseGuards,
} from '@nestjs/common';
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
