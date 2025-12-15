import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { StampsService } from './stamps.service';
import { ValidateStampDto } from './dto/validate-stamp.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../common/roles.decorator';
import { RolesGuard } from '../common/roles.guard';
import { UserRole } from '@prisma/client';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('stamps')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('stamps')
export class StampsController {
  constructor(private readonly stampsService: StampsService) {}

  @Post('validate')
  validateStamp(@Body() dto: ValidateStampDto, @Request() req) {
    return this.stampsService.validateAndCollect(dto.code, req.user.userId);
  }

  @Get('user/me')
  getUserStamps(@Request() req) {
    return this.stampsService.getUserStamps(req.user.userId);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Get()
  getAllStamps() {
    return this.stampsService.getAllStamps();
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Get('stats')
  getStampStats() {
    return this.stampsService.getStampStats();
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Delete(':id')
  deleteStamp(@Param('id') id: string) {
    return this.stampsService.deleteStamp(id);
  }
}
