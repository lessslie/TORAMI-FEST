import {
  Controller,
  Get,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../common/roles.decorator';
import { RolesGuard } from '../common/roles.guard';
import { UserRole } from '@prisma/client';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Get()
  async findAll() {
    return this.usersService.findAll();
  }

  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() data: Partial<{ name: string; email: string; whatsapp: string; phone: string; role: UserRole; entryAuthorized: boolean }>,
  ) {
    return this.usersService.updateUser(id, data);
  }

  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.usersService.deleteUser(id);
  }
}
