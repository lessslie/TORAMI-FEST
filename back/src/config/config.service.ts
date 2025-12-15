import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateConfigDto } from './dto/update-config.dto';

@Injectable()
export class ConfigService {
  constructor(private readonly prisma: PrismaService) {}

  async getConfig() {
    // El AppConfig siempre tiene id=1 (singleton)
    let config = await this.prisma.appConfig.findUnique({
      where: { id: 1 },
    });

    // Si no existe, crear configuración por defecto
    if (!config) {
      config = await this.prisma.appConfig.create({
        data: {
          id: 1,
          donationsEnabled: true,
          homeGalleryImages: [],
        },
      });
    }

    return config;
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
