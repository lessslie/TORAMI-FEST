import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
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
    // TODO: Remove after running: npx prisma db push
    // Temporarily remove whatsapp field until migration is run
    const { whatsapp, ...safeData } = data;

    return this.prisma.user.update({
      where: { id: userId },
      data: safeData,
    });
  }

  async findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        // whatsapp: true, // TODO: Uncomment after running: npx prisma db push
        phone: true,
        age: true,
        entryAuthorized: true,
        ticketType: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateUser(
    userId: string,
    data: Partial<{ name: string; email: string; whatsapp: string; phone: string; role: UserRole; entryAuthorized: boolean }>,
  ) {
    // TODO: Remove after running: npx prisma db push
    // Temporarily remove whatsapp field until migration is run
    const { whatsapp, ...safeData } = data;

    return this.prisma.user.update({
      where: { id: userId },
      data: safeData,
    });
  }

  async deleteUser(userId: string) {
    return this.prisma.user.delete({
      where: { id: userId },
    });
  }
}
