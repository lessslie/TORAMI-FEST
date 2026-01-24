import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateConfigDto } from './dto/update-config.dto';

@Injectable()
export class ConfigService {
  constructor(private readonly prisma: PrismaService) {}

  async getConfig(includeImages: boolean = false) {
    // Campos base que siempre existen
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
      karaokeLimit: true,
      // Control de inscripciones
      cosplayInscripcionesAbiertas: true,
      cosplayGuestInscripcionesAbiertas: true,
      standsInscripcionesAbiertas: true,
      karaokeInscripcionesAbiertas: true,
    };

    // El AppConfig siempre tiene id=1 (singleton)
    let config: any = null;

    try {
      // Intentar con todos los campos incluyendo giveawaysInscripcionesAbiertas
      const fullSelect = { ...baseSelect, giveawaysInscripcionesAbiertas: true };
      config = includeImages
        ? await this.prisma.appConfig.findUnique({ where: { id: 1 } })
        : await this.prisma.appConfig.findUnique({ where: { id: 1 }, select: fullSelect });
    } catch (error) {
      // Si falla (columna no existe), intentar sin giveawaysInscripcionesAbiertas
      console.warn('giveawaysInscripcionesAbiertas column may not exist, using default value');
      config = includeImages
        ? await this.prisma.appConfig.findUnique({ where: { id: 1 } })
        : await this.prisma.appConfig.findUnique({ where: { id: 1 }, select: baseSelect });

      if (config) {
        config.giveawaysInscripcionesAbiertas = true; // Valor por defecto
      }
    }

    // Si no existe, crear configuración por defecto
    if (!config) {
      try {
        const data = {
          id: 1,
          donationsEnabled: true,
          giveawaysInscripcionesAbiertas: true,
          homeGalleryImages: [],
        };
        if (includeImages) {
          return this.prisma.appConfig.create({ data });
        }

        const fullSelect = { ...baseSelect, giveawaysInscripcionesAbiertas: true };
        const created = await this.prisma.appConfig.create({ data, select: fullSelect });
        return { ...created, homeGalleryImages: [] };
      } catch (createError) {
        // Si falla al crear con giveawaysInscripcionesAbiertas, crear sin ella
        const data = {
          id: 1,
          donationsEnabled: true,
          homeGalleryImages: [],
        };
        if (includeImages) {
          const created = await this.prisma.appConfig.create({ data });
          return { ...created, giveawaysInscripcionesAbiertas: true };
        }

        const created = await this.prisma.appConfig.create({ data, select: baseSelect });
        return { ...created, homeGalleryImages: [], giveawaysInscripcionesAbiertas: true };
      }
    }

    // Asegurar que giveawaysInscripcionesAbiertas tenga un valor
    if (config.giveawaysInscripcionesAbiertas === undefined) {
      config.giveawaysInscripcionesAbiertas = true;
    }

    if (includeImages) {
      return config;
    }

    return { ...config, homeGalleryImages: [] };
  }

  async updateConfig(data: UpdateConfigDto) {
    // Asegurar que existe la configuración
    await this.getConfig();

    try {
      return await this.prisma.appConfig.update({
        where: { id: 1 },
        data,
      });
    } catch (error: any) {
      // Si falla por giveawaysInscripcionesAbiertas, intentar sin ella
      if (error.message?.includes('giveawaysInscripcionesAbiertas')) {
        const { giveawaysInscripcionesAbiertas, ...dataWithoutGiveaways } = data as any;
        const updated = await this.prisma.appConfig.update({
          where: { id: 1 },
          data: dataWithoutGiveaways,
        });
        return { ...updated, giveawaysInscripcionesAbiertas: giveawaysInscripcionesAbiertas ?? true };
      }
      throw error;
    }
  }

  async resetConfig() {
    // Eliminar configuración existente
    await this.prisma.appConfig.deleteMany({});

    // Crear configuración por defecto (con manejo de columna faltante)
    try {
      return await this.prisma.appConfig.create({
        data: {
          id: 1,
          donationsEnabled: true,
          giveawaysInscripcionesAbiertas: true,
          homeGalleryImages: [],
        },
      });
    } catch (error) {
      // Si falla por columna faltante, crear sin ella
      const created = await this.prisma.appConfig.create({
        data: {
          id: 1,
          donationsEnabled: true,
          homeGalleryImages: [],
        },
      });
      return { ...created, giveawaysInscripcionesAbiertas: true };
    }
  }
}
