import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNotificationDto } from './dto/create-notification.dto';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllByUser(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId?: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    // Validar pertenencia si se proporciona userId
    if (userId && notification.userId !== userId) {
      throw new ForbiddenException('No tienes acceso a esta notificación');
    }

    return notification;
  }

  async create(data: CreateNotificationDto) {
    return this.prisma.notification.create({
      data: {
        ...data,
        read: false,
      },
    });
  }

  async markAsRead(id: string, userId: string) {
    // Valida que la notificación pertenezca al usuario
    await this.findOne(id, userId);

    return this.prisma.notification.update({
      where: { id },
      data: { read: true },
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: {
        userId,
        read: false,
      },
      data: {
        read: true,
      },
    });
  }

  async delete(id: string, userId: string) {
    // Valida que la notificación pertenezca al usuario
    await this.findOne(id, userId);
    return this.prisma.notification.delete({ where: { id } });
  }

  async deleteAllByUser(userId: string) {
    return this.prisma.notification.deleteMany({
      where: { userId },
    });
  }

  async getUnreadCount(userId: string) {
    const count = await this.prisma.notification.count({
      where: {
        userId,
        read: false,
      },
    });

    return { count };
  }
}
