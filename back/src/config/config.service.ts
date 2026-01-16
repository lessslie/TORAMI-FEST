import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateConfigDto } from './dto/update-config.dto';

@Injectable()
export class ConfigService {
  constructor(private readonly prisma: PrismaService) {}

  async getConfig(includeImages: boolean = false) {
    const baseSelect = {
      id: true,
      donationsEnabled: true,
      paymentLink: true,
      aliasCbu: true,
      qrImage: true,
      heroTitle: true,
      heroSubtitle: true,
      heroDateText: true,
      donationTitle: true,
      donationDescription: true,
      donationImage: true,
      donationGoal: true,
      cosplayLimit: true,
      cosplayGuestLimit: true,
    };

    // El AppConfig siempre tiene id=1 (singleton)
    const config = includeImages
      ? await this.prisma.appConfig.findUnique({ where: { id: 1 } })
      : await this.prisma.appConfig.findUnique({ where: { id: 1 }, select: baseSelect });

    // Si no existe, crear configuración por defecto
    if (!config) {
      const data = {
        id: 1,
        donationsEnabled: true,
        homeGalleryImages: [],
      };
      if (includeImages) {
        return this.prisma.appConfig.create({ data });
      }

      const created = await this.prisma.appConfig.create({ data, select: baseSelect });
      return { ...created, homeGalleryImages: [] };
    }

    if (includeImages) {
      return config;
    }

    return { ...config, homeGalleryImages: [] };
  }

  async updateConfig(data: UpdateConfigDto) {
    // Asegurar que existe la configuración
    await this.getConfig();

    return this.prisma.appConfig.update({
      where: { id: 1 },
      data,
    });
  }

  async resetConfig() {
    // Eliminar configuración existente
    await this.prisma.appConfig.deleteMany({});

    // Crear configuración por defecto
    return this.prisma.appConfig.create({
      data: {
        id: 1,
        donationsEnabled: true,
        homeGalleryImages: [],
      },
    });
  }
}
