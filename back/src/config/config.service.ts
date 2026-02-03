import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateConfigDto } from './dto/update-config.dto';

@Injectable()
export class ConfigService {
  // Caché en memoria para límites (evita queries repetidas)
  private limitsCache: {
    cosplayLimit: number;
    cosplayGuestLimit: number;
    karaokeLimit: number;
    timestamp: number;
  } | null = null;

  // Caché para flags de inscripciones
  private inscripcionesCache: {
    cosplayInscripcionesAbiertas: boolean;
    cosplayGuestInscripcionesAbiertas: boolean;
    standsInscripcionesAbiertas: boolean;
    karaokeInscripcionesAbiertas: boolean;
    giveawaysInscripcionesAbiertas: boolean;
    timestamp: number;
  } | null = null;

  private readonly CACHE_TTL = 60000; // 1 minuto

  constructor(private readonly prisma: PrismaService) {}

  // Obtener límites con caché (para uso interno de otros services)
  async getLimits(): Promise<{ cosplayLimit: number; cosplayGuestLimit: number; karaokeLimit: number }> {
    const now = Date.now();

    // Si el caché es válido, retornarlo
    if (this.limitsCache && (now - this.limitsCache.timestamp) < this.CACHE_TTL) {
      return {
        cosplayLimit: this.limitsCache.cosplayLimit,
        cosplayGuestLimit: this.limitsCache.cosplayGuestLimit,
        karaokeLimit: this.limitsCache.karaokeLimit,
      };
    }

    // Si no, hacer query y cachear
    const config = await this.prisma.appConfig.findFirst({
      select: {
        cosplayLimit: true,
        cosplayGuestLimit: true,
        karaokeLimit: true,
      },
    });

    this.limitsCache = {
      cosplayLimit: config?.cosplayLimit ?? 20,
      cosplayGuestLimit: config?.cosplayGuestLimit ?? 30,
      karaokeLimit: config?.karaokeLimit ?? 20,
      timestamp: now,
    };

    return {
      cosplayLimit: this.limitsCache.cosplayLimit,
      cosplayGuestLimit: this.limitsCache.cosplayGuestLimit,
      karaokeLimit: this.limitsCache.karaokeLimit,
    };
  }

  // Invalidar caché cuando se actualiza config
  invalidateLimitsCache() {
    this.limitsCache = null;
  }

  // Invalidar caché de inscripciones
  invalidateInscripcionesCache() {
    this.inscripcionesCache = null;
  }

  // Obtener flags de inscripciones con caché
  async getInscripcionesFlags(): Promise<{
    cosplayInscripcionesAbiertas: boolean;
    cosplayGuestInscripcionesAbiertas: boolean;
    standsInscripcionesAbiertas: boolean;
    karaokeInscripcionesAbiertas: boolean;
    giveawaysInscripcionesAbiertas: boolean;
  }> {
    const now = Date.now();

    // Si el caché es válido, retornarlo
    if (this.inscripcionesCache && (now - this.inscripcionesCache.timestamp) < this.CACHE_TTL) {
      return {
        cosplayInscripcionesAbiertas: this.inscripcionesCache.cosplayInscripcionesAbiertas,
        cosplayGuestInscripcionesAbiertas: this.inscripcionesCache.cosplayGuestInscripcionesAbiertas,
        standsInscripcionesAbiertas: this.inscripcionesCache.standsInscripcionesAbiertas,
        karaokeInscripcionesAbiertas: this.inscripcionesCache.karaokeInscripcionesAbiertas,
        giveawaysInscripcionesAbiertas: this.inscripcionesCache.giveawaysInscripcionesAbiertas,
      };
    }

    // Si no, hacer query y cachear
    let config: any = null;
    try {
      config = await this.prisma.appConfig.findFirst({
        select: {
          cosplayInscripcionesAbiertas: true,
          cosplayGuestInscripcionesAbiertas: true,
          standsInscripcionesAbiertas: true,
          karaokeInscripcionesAbiertas: true,
          giveawaysInscripcionesAbiertas: true,
        },
      });
    } catch {
      // Si falla (columna no existe), usar defaults
      config = null;
    }

    this.inscripcionesCache = {
      cosplayInscripcionesAbiertas: config?.cosplayInscripcionesAbiertas ?? true,
      cosplayGuestInscripcionesAbiertas: config?.cosplayGuestInscripcionesAbiertas ?? true,
      standsInscripcionesAbiertas: config?.standsInscripcionesAbiertas ?? true,
      karaokeInscripcionesAbiertas: config?.karaokeInscripcionesAbiertas ?? true,
      giveawaysInscripcionesAbiertas: config?.giveawaysInscripcionesAbiertas ?? true,
      timestamp: now,
    };

    return {
      cosplayInscripcionesAbiertas: this.inscripcionesCache.cosplayInscripcionesAbiertas,
      cosplayGuestInscripcionesAbiertas: this.inscripcionesCache.cosplayGuestInscripcionesAbiertas,
      standsInscripcionesAbiertas: this.inscripcionesCache.standsInscripcionesAbiertas,
      karaokeInscripcionesAbiertas: this.inscripcionesCache.karaokeInscripcionesAbiertas,
      giveawaysInscripcionesAbiertas: this.inscripcionesCache.giveawaysInscripcionesAbiertas,
    };
  }

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
      standsInfoText: true,
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

    // Remover giveawaysInscripcionesAbiertas del data ya que la columna no existe
    const { giveawaysInscripcionesAbiertas, ...dataWithoutGiveaways } = data as any;

    try {
      const updated = await this.prisma.appConfig.update({
        where: { id: 1 },
        data: dataWithoutGiveaways,
      });
      // Invalidar cachés
      this.invalidateLimitsCache();
      this.invalidateInscripcionesCache();
      // Agregar el campo de vuelta en la respuesta con valor por defecto
      return { ...updated, giveawaysInscripcionesAbiertas: giveawaysInscripcionesAbiertas ?? true };
    } catch (error: any) {
      console.error('Error updating config:', error);
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
