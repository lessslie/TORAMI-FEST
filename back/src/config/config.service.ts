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

    // Primero intentar con todos los campos
    const fullSelect = { ...baseSelect, giveawaysInscripcionesAbiertas: true, homeGalleryImages: true };

    try {
      config = await this.prisma.appConfig.findUnique({ where: { id: 1 }, select: fullSelect });
    } catch (error) {
      // Si falla (columna giveawaysInscripcionesAbiertas no existe), intentar sin ella
      console.warn('giveawaysInscripcionesAbiertas column may not exist, using default value');
      const fallbackSelect = { ...baseSelect, homeGalleryImages: true };
      config = await this.prisma.appConfig.findUnique({ where: { id: 1 }, select: fallbackSelect });

      if (config) {
        config.giveawaysInscripcionesAbiertas = true; // Valor por defecto
      }
    }

    // Si no existe, crear configuración por defecto
    if (!config) {
      try {
        const createData = {
          id: 1,
          donationsEnabled: true,
          giveawaysInscripcionesAbiertas: true,
          homeGalleryImages: [],
        };
        const createSelect = { ...baseSelect, giveawaysInscripcionesAbiertas: true, homeGalleryImages: true };
        const created = await this.prisma.appConfig.create({ data: createData, select: createSelect });

        if (includeImages) {
          return created;
        }
        return { ...created, homeGalleryImages: [] };
      } catch (createError) {
        // Si falla al crear con giveawaysInscripcionesAbiertas, crear sin ella
        const createData = {
          id: 1,
          donationsEnabled: true,
          homeGalleryImages: [],
        };
        const fallbackSelect = { ...baseSelect, homeGalleryImages: true };
        const created = await this.prisma.appConfig.create({ data: createData, select: fallbackSelect });

        if (includeImages) {
          return { ...created, giveawaysInscripcionesAbiertas: true };
        }
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
