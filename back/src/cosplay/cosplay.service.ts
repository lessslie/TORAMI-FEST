import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '../config/config.service';
import { CreateCosplayDto } from './dto/create-cosplay.dto';
import { UpdateCosplayStatusDto } from './dto/update-cosplay-status.dto';
import { CosplayStatus } from '@prisma/client';
import { EmailService } from '../email/email.service';

@Injectable()
export class CosplayService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {}

  async findAll(page: number = 1, limit: number = 20, status?: string) {
    const skip = (page - 1) * limit;
    const where = status ? { status: status as CosplayStatus } : {};

    const [registrations, total] = await Promise.all([
      this.prisma.cosplayRegistration.findMany({
        take: limit,
        skip,
        where,
        select: {
          id: true,
          participantName: true,
          nickname: true,
          whatsapp: true,
          characterName: true,
          seriesName: true,
          category: true,
          status: true,
          createdAt: true,
          eventId: true,
          userId: true,
          event: true,
          referenceImage: true,
        },
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.cosplayRegistration.count({ where })
    ]);

    return {
      data: registrations,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  findByUser(userId: string) {
    return this.prisma.cosplayRegistration.findMany({
      where: { userId },
      include: {
        event: true,
      },
    });
  }

  findOne(id: string) {
    return this.prisma.cosplayRegistration.findUnique({
      where: { id },
      include: {
        event: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
  }

  async create(userId: string, dto: CreateCosplayDto) {
    // Check if user is already registered for this event
    const existingRegistration = await this.prisma.cosplayRegistration.findFirst({
      where: {
        userId,
        eventId: dto.eventId,
        status: {
          not: CosplayStatus.RECHAZADO, // Allow re-registration if previously rejected
        },
      },
    });

    if (existingRegistration) {
      throw new BadRequestException('Ya estás inscrito en el concurso de cosplay para este evento.');
    }

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

  /**
   * Get the number of available slots for cosplay registration
   * Slots are occupied by: INSCRIPTO and CONFIRMADO statuses
   * Slots are NOT occupied by: RECHAZADO and WAITING_LIST statuses
   */
  async getAvailableSlots(): Promise<number> {
    // Get the limit from cached config
    const limits = await this.configService.getLimits();
    const limit = limits.cosplayLimit;

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
   * Get cosplay limit from cached config
   */
  async getCosplayLimit(): Promise<number> {
    const limits = await this.configService.getLimits();
    return limits.cosplayLimit;
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
      return;
    }

    // Extract emails (prefer notifyEmail, fallback to user email)
    const emails = waitingList.map(reg => reg.notifyEmail || reg.user.email).filter(Boolean);

    if (emails.length === 0) {
      return;
    }

    const limit = await this.getCosplayLimit();

    // Send notification emails
    try {
      await this.emailService.sendSlotAvailableNotification(emails, availableSlots, limit);
    } catch (error) {
      console.error('❌ Error notifying waiting list:', error);
    }
  }

  async delete(id: string) {
    // When deleting, check if we need to notify waiting list
    const registration = await this.prisma.cosplayRegistration.findUnique({ where: { id } });

    const result = await this.prisma.cosplayRegistration.delete({
      where: { id },
    });

    // If deleted registration was occupying a slot, notify waiting list
    if (registration && (registration.status === CosplayStatus.INSCRIPTO || registration.status === CosplayStatus.CONFIRMADO)) {
      await this.notifyWaitingList();
    }

    return result;
  }

  // Obtener todos los registros para exportación (con límite de seguridad)
  async findAllForExport(limit: number = 1000) {
    return this.prisma.cosplayRegistration.findMany({
      take: limit,
      include: {
        event: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
