import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        whatsapp: true,
        phone: true,
        age: true,
        entryAuthorized: true,
        ticketType: true,
        createdAt: true,
        // NO incluir password
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async create(data: {
    name: string;
    email: string;
    password: string;
    age?: number;
    phone?: string;
    whatsapp?: string;
    role?: UserRole;
  }) {
    return this.prisma.user.create({
      data: {
        ...data,
        role: data.role ?? UserRole.USER,
      },
    });
  }

  async updateProfile(userId: string, data: Partial<{ name: string; email: string; avatar: string; whatsapp: string }>) {
    return this.prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        whatsapp: true,
        phone: true,
        age: true,
        entryAuthorized: true,
        ticketType: true,
        createdAt: true,
        // NO incluir password
      },
    });
  }

  async findAll(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          avatar: true,
          whatsapp: true,
          phone: true,
          age: true,
          entryAuthorized: true,
          ticketType: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.user.count(),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async updateUser(
    userId: string,
    data: Partial<{ name: string; email: string; whatsapp: string; phone: string; role: UserRole; entryAuthorized: boolean }>,
  ) {
    return this.prisma.user.update({
      where: { id: userId },
      data,
    });
  }

  async deleteUser(userId: string) {
    // Verificar que no se intente eliminar a un SUPER_ADMIN
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }
    if (user.role === UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('No se puede eliminar a un SUPER_ADMIN');
    }

    return this.prisma.user.delete({
      where: { id: userId },
    });
  }
}
