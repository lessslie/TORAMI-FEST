import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCosplayDto } from './dto/create-cosplay.dto';
import { UpdateCosplayStatusDto } from './dto/update-cosplay-status.dto';
import { CosplayAddMessageDto } from './dto/add-message.dto';
import { CosplayStatus } from '@prisma/client';
import { EmailService } from '../email/email.service';

@Injectable()
export class CosplayService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  findAll() {
    return this.prisma.cosplayRegistration.findMany({
      include: {
        event: true,
      },
    });
  }

  findByUser(userId: string) {
    return this.prisma.cosplayRegistration.findMany({
      where: { userId },
      include: {
        event: true,
      },
    });
  }

  async create(userId: string, dto: CreateCosplayDto) {
    // Check if slots are available
    const availableSlots = await this.getAvailableSlots();
    if (availableSlots === 0) {
      throw new BadRequestException('No hay cupos disponibles. Podés anotarte en la lista de espera.');
    }

    return this.prisma.cosplayRegistration.create({
      data: {
        ...dto,
        userId,
        status: dto.status ?? CosplayStatus.INSCRIPTO,
        messages: [],
      },
    });
  }

  async updateStatus(id: string, dto: UpdateCosplayStatusDto) {
    const updated = await this.prisma.cosplayRegistration.update({
      where: { id },
      data: { status: dto.status },
    });

    // If status changed to RECHAZADO, a slot was freed - notify waiting list
    if (dto.status === CosplayStatus.RECHAZADO) {
      await this.notifyWaitingList();
    }

    return updated;
  }

  async addMessage(id: string, dto: CosplayAddMessageDto, requesterId: string, requesterRole: string) {
    const item = await this.prisma.cosplayRegistration.findUnique({ where: { id } });
    if (!item) throw new ForbiddenException('Cosplay not found');
    if (dto.sender === 'USER' && item.userId !== requesterId) throw new ForbiddenException();
    const updatedMessages = [
      ...(item.messages as any[]),
      { id: Date.now().toString(), ...dto, timestamp: new Date().toISOString() },
    ];

    // Create notification when admin sends message to user
    if (dto.sender === 'ADMIN') {
      await this.prisma.notification.create({
        data: {
          userId: item.userId,
          title: 'Nuevo mensaje sobre tu inscripción al concurso',
          message: `Recibiste un mensaje sobre "${item.characterName}"`,
          type: 'CHAT_COSPLAY',
          link: '/dashboard',
        },
      });
    }

    // Create notification for ALL admins when user sends message
    if (dto.sender === 'USER') {
      const admins = await this.prisma.user.findMany({
        where: {
          role: { in: ['ADMIN', 'SUPER_ADMIN'] },
        },
        select: { id: true },
      });

      // Create notification for each admin
      await Promise.all(
        admins.map((admin) =>
          this.prisma.notification.create({
            data: {
              userId: admin.id,
              title: 'Nuevo mensaje de participante',
              message: `${item.participantName} te envió un mensaje sobre su cosplay "${item.characterName}"`,
              type: 'CHAT_COSPLAY',
              link: '/admin',
            },
          })
        )
      );
    }

    return this.prisma.cosplayRegistration.update({
      where: { id },
      data: { messages: updatedMessages },
    });
  }

  /**
   * Get the number of available slots for cosplay registration
   * Slots are occupied by: INSCRIPTO and CONFIRMADO statuses
   * Slots are NOT occupied by: RECHAZADO and WAITING_LIST statuses
   */
  async getAvailableSlots(): Promise<number> {
    // Get the limit from config
    const config = await this.prisma.appConfig.findFirst();
    const limit = config?.cosplayLimit ?? 20;

    // Count registrations that occupy slots (INSCRIPTO + CONFIRMADO)
    const occupiedSlots = await this.prisma.cosplayRegistration.count({
      where: {
        status: {
          in: [CosplayStatus.INSCRIPTO, CosplayStatus.CONFIRMADO],
        },
      },
    });

    return Math.max(0, limit - occupiedSlots);
  }

  /**
   * Get cosplay limit from config
   */
  async getCosplayLimit(): Promise<number> {
    const config = await this.prisma.appConfig.findFirst();
    return config?.cosplayLimit ?? 20;
  }

  /**
   * Add user to waiting list
   */
  async addToWaitingList(userId: string, dto: any) {
    // Check if user already has an active registration
    const existingRegistration = await this.prisma.cosplayRegistration.findFirst({
      where: {
        userId,
        status: {
          in: [CosplayStatus.INSCRIPTO, CosplayStatus.CONFIRMADO, CosplayStatus.WAITING_LIST],
        },
      },
    });

    if (existingRegistration) {
      throw new BadRequestException('Ya tenés una inscripción activa o estás en la lista de espera.');
    }

    return this.prisma.cosplayRegistration.create({
      data: {
        ...dto,
        userId,
        status: CosplayStatus.WAITING_LIST,
        messages: [],
      },
    });
  }

  /**
   * Notify all users in waiting list that a slot is available
   */
  async notifyWaitingList() {
    const availableSlots = await this.getAvailableSlots();

    // Only notify if there are available slots
    if (availableSlots === 0) {
      console.log('📧 No available slots, skipping waiting list notification');
      return;
    }

    // Get all users in waiting list
    const waitingList = await this.prisma.cosplayRegistration.findMany({
      where: {
        status: CosplayStatus.WAITING_LIST,
      },
      include: {
        user: true,
      },
    });

    if (waitingList.length === 0) {
      console.log('📧 No users in waiting list to notify');
      return;
    }

    // Extract emails (prefer notifyEmail, fallback to user email)
    const emails = waitingList.map(reg => reg.notifyEmail || reg.user.email).filter(Boolean);

    if (emails.length === 0) {
      console.log('📧 No valid emails in waiting list');
      return;
    }

    const limit = await this.getCosplayLimit();

    // Send notification emails
    try {
      await this.emailService.sendSlotAvailableNotification(emails, availableSlots, limit);
      console.log(`📧 Notified ${emails.length} users in waiting list about ${availableSlots} available slot(s)`);
    } catch (error) {
      console.error('❌ Error notifying waiting list:', error);
    }
  }
}
