import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '../config/config.service';
import { CreateGiveawayDto } from './dto/create-giveaway.dto';
import { UpdateGiveawayDto } from './dto/update-giveaway.dto';
import { CreateParticipantDto } from './dto/create-participant.dto';
import { GiveawayStatus } from '@prisma/client';

@Injectable()
export class GiveawaysService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async findAll() {
    return this.prisma.giveaway.findMany({
      include: {
        // Solo traemos el conteo, no todos los participantes
        _count: {
          select: { participants: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const giveaway = await this.prisma.giveaway.findUnique({
      where: { id },
      include: {
        participants: {
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: { participants: true },
        },
      },
    });

    if (!giveaway) {
      throw new NotFoundException('Sorteo no encontrado');
    }

    return giveaway;
  }

  // Obtener el sorteo activo actual (para el formulario público)
  async findActive() {
    const now = new Date();

    const giveaway = await this.prisma.giveaway.findFirst({
      where: {
        status: GiveawayStatus.ACTIVO,
        isEnabled: true,
        startDate: { lte: now },
        endDate: { gte: now },
      },
      include: {
        _count: {
          select: { participants: true },
        },
      },
    });

    return giveaway;
  }

  async create(data: CreateGiveawayDto) {
    return this.prisma.giveaway.create({
      data: {
        title: data.title,
        description: data.description,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        isEnabled: data.isEnabled ?? true,
        status: GiveawayStatus.ACTIVO,
      },
      include: {
        _count: {
          select: { participants: true },
        },
      },
    });
  }

  async update(id: string, data: UpdateGiveawayDto) {
    await this.findOne(id);

    const updateData: any = { ...data };

    if (data.startDate) {
      updateData.startDate = new Date(data.startDate);
    }
    if (data.endDate) {
      updateData.endDate = new Date(data.endDate);
    }

    return this.prisma.giveaway.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: { participants: true },
        },
      },
    });
  }

  async delete(id: string) {
    await this.findOne(id);
    return this.prisma.giveaway.delete({ where: { id } });
  }

  // Inscripción pública al sorteo (formulario)
  async participate(giveawayId: string, data: CreateParticipantDto, userId?: string) {
    // Verificar config global (usando caché)
    const flags = await this.configService.getInscripcionesFlags();
    if (!flags.giveawaysInscripcionesAbiertas) {
      throw new BadRequestException('Las inscripciones de sorteos están cerradas');
    }

    const giveaway = await this.findOne(giveawayId);
    const now = new Date();

    // Verificar estado del sorteo
    if (giveaway.status !== GiveawayStatus.ACTIVO) {
      throw new BadRequestException('Este sorteo no está activo');
    }

    // Verificar toggle manual
    if (!giveaway.isEnabled) {
      throw new BadRequestException('Las inscripciones para este sorteo están cerradas');
    }

    // Verificar fechas
    if (now < giveaway.startDate) {
      throw new BadRequestException('Este sorteo aún no ha comenzado');
    }
    if (now > giveaway.endDate) {
      throw new BadRequestException('Este sorteo ya ha finalizado');
    }

    // Verificar DNI único por sorteo
    const existingByDni = await this.prisma.giveawayParticipant.findUnique({
      where: {
        giveawayId_dni: {
          giveawayId,
          dni: data.dni,
        },
      },
    });

    if (existingByDni) {
      throw new BadRequestException('Ya te inscribiste a este sorteo con este DNI');
    }

    // Crear participante
    await this.prisma.giveawayParticipant.create({
      data: {
        giveawayId,
        fullName: data.fullName,
        birthDate: new Date(data.birthDate),
        dni: data.dni,
        whatsapp: data.whatsapp,
        email: data.email,
        instagram: data.instagram,
        userId: userId || null,
      },
    });

    return { message: 'Inscripción exitosa', success: true };
  }

  // Obtener participantes de un sorteo (para admin)
  async getParticipants(giveawayId: string, limit: number = 500) {
    await this.findOne(giveawayId);

    return this.prisma.giveawayParticipant.findMany({
      where: { giveawayId },
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
  }

  // Verificar si un DNI ya está inscripto
  async checkDni(giveawayId: string, dni: string) {
    const existing = await this.prisma.giveawayParticipant.findUnique({
      where: {
        giveawayId_dni: {
          giveawayId,
          dni,
        },
      },
    });

    return { isRegistered: !!existing };
  }

  async getUserGiveaways(userId: string) {
    return this.prisma.giveaway.findMany({
      where: {
        participants: {
          some: {
            userId,
          },
        },
      },
      include: {
        participants: {
          where: { userId },
        },
        _count: {
          select: { participants: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
