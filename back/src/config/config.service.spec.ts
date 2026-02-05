/**
 * ===========================================
 * TEST UNITARIO PARA ConfigService
 * ===========================================
 *
 * Este servicio maneja la configuración global de la app.
 *
 * CARACTERÍSTICAS:
 * - Singleton: Solo existe un registro de configuración (id=1)
 * - Caché: Los límites y flags se cachean en memoria (1 minuto)
 * - Defaults: Si no existe configuración, se usan valores por defecto
 *
 * CONFIGURACIONES QUE MANEJA:
 * - Límites: cosplayLimit, cosplayGuestLimit, karaokeLimit
 * - Flags de inscripciones: *InscripcionesAbiertas
 * - Donaciones: donationsEnabled, paymentLink, etc.
 * - Hero: heroTitle, heroSubtitle, etc.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from './config.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ConfigService', () => {
  let service: ConfigService;

  const mockPrismaService = {
    appConfig: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      deleteMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConfigService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    // Limpiar caché entre tests usando los métodos públicos
    service.invalidateLimitsCache();
    service.invalidateInscripcionesCache();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // =========================================
  // TESTS PARA: getLimits() - Obtener límites con caché
  // =========================================
  describe('getLimits', () => {
    /**
     * TEST 1: Obtener límites desde DB
     */
    it('should return limits from database', async () => {
      // ARRANGE
      mockPrismaService.appConfig.findFirst.mockResolvedValue({
        cosplayLimit: 50,
        cosplayGuestLimit: 40,
        karaokeLimit: 30,
      });

      // ACT
      const result = await service.getLimits();

      // ASSERT
      expect(result).toEqual({
        cosplayLimit: 50,
        cosplayGuestLimit: 40,
        karaokeLimit: 30,
      });
    });

    /**
     * TEST 2: Usar valores por defecto si no hay config
     */
    it('should return default values if no config exists', async () => {
      // ARRANGE
      mockPrismaService.appConfig.findFirst.mockResolvedValue(null);

      // ACT
      const result = await service.getLimits();

      // ASSERT
      expect(result).toEqual({
        cosplayLimit: 20,      // Default
        cosplayGuestLimit: 30, // Default
        karaokeLimit: 20,      // Default
      });
    });

    /**
     * TEST 3: Usar caché en llamadas subsiguientes
     * ------------------------------------------
     * La primera llamada hace query, las siguientes usan caché.
     */
    it('should use cache on subsequent calls', async () => {
      // ARRANGE
      mockPrismaService.appConfig.findFirst.mockResolvedValue({
        cosplayLimit: 50,
        cosplayGuestLimit: 40,
        karaokeLimit: 30,
      });

      // ACT - Primera llamada
      await service.getLimits();
      // Segunda llamada (debería usar caché)
      await service.getLimits();
      // Tercera llamada
      await service.getLimits();

      // ASSERT - Solo debe haber hecho 1 query
      expect(mockPrismaService.appConfig.findFirst).toHaveBeenCalledTimes(1);
    });
  });

  // =========================================
  // TESTS PARA: getInscripcionesFlags() - Flags de inscripciones
  // =========================================
  describe('getInscripcionesFlags', () => {
    /**
     * TEST 1: Obtener flags desde DB
     */
    it('should return inscription flags from database', async () => {
      // ARRANGE
      mockPrismaService.appConfig.findFirst.mockResolvedValue({
        cosplayInscripcionesAbiertas: true,
        cosplayGuestInscripcionesAbiertas: false,
        standsInscripcionesAbiertas: true,
        karaokeInscripcionesAbiertas: false,
        giveawaysInscripcionesAbiertas: true,
      });

      // ACT
      const result = await service.getInscripcionesFlags();

      // ASSERT
      expect(result).toEqual({
        cosplayInscripcionesAbiertas: true,
        cosplayGuestInscripcionesAbiertas: false,
        standsInscripcionesAbiertas: true,
        karaokeInscripcionesAbiertas: false,
        giveawaysInscripcionesAbiertas: true,
      });
    });

    /**
     * TEST 2: Valores por defecto (todo abierto)
     */
    it('should return default values (all open) if no config', async () => {
      // ARRANGE
      mockPrismaService.appConfig.findFirst.mockResolvedValue(null);

      // ACT
      const result = await service.getInscripcionesFlags();

      // ASSERT - Por defecto todo está abierto
      expect(result.cosplayInscripcionesAbiertas).toBe(true);
      expect(result.standsInscripcionesAbiertas).toBe(true);
      expect(result.karaokeInscripcionesAbiertas).toBe(true);
    });
  });

  // =========================================
  // TESTS PARA: invalidateLimitsCache()
  // =========================================
  describe('invalidateLimitsCache', () => {
    /**
     * TEST: Después de invalidar, debe hacer nueva query
     */
    it('should force new query after cache invalidation', async () => {
      // ARRANGE
      mockPrismaService.appConfig.findFirst.mockResolvedValue({
        cosplayLimit: 50,
        cosplayGuestLimit: 40,
        karaokeLimit: 30,
      });

      // Primera llamada
      await service.getLimits();
      expect(mockPrismaService.appConfig.findFirst).toHaveBeenCalledTimes(1);

      // Invalidar caché
      service.invalidateLimitsCache();

      // Segunda llamada - debe hacer nueva query
      await service.getLimits();
      expect(mockPrismaService.appConfig.findFirst).toHaveBeenCalledTimes(2);
    });
  });

  // =========================================
  // TESTS PARA: getConfig() - Obtener config completa
  // =========================================
  describe('getConfig', () => {
    /**
     * TEST 1: Obtener configuración existente
     */
    it('should return existing config', async () => {
      // ARRANGE
      const mockConfig = {
        id: 1,
        donationsEnabled: true,
        heroTitle: 'Torami Fest',
        cosplayLimit: 50,
      };
      mockPrismaService.appConfig.findUnique.mockResolvedValue(mockConfig);

      // ACT
      const result = await service.getConfig();

      // ASSERT
      expect(result.donationsEnabled).toBe(true);
      expect(result.heroTitle).toBe('Torami Fest');
    });

    /**
     * TEST 2: Crear config si no existe
     */
    it('should create default config if none exists', async () => {
      // ARRANGE
      mockPrismaService.appConfig.findUnique.mockResolvedValue(null);
      mockPrismaService.appConfig.create.mockResolvedValue({
        id: 1,
        donationsEnabled: true,
      });

      // ACT
      const result = await service.getConfig();

      // ASSERT
      expect(mockPrismaService.appConfig.create).toHaveBeenCalled();
      expect(result.donationsEnabled).toBe(true);
    });
  });

  // =========================================
  // TESTS PARA: updateConfig() - Actualizar config
  // =========================================
  describe('updateConfig', () => {
    /**
     * TEST: Actualizar e invalidar caché
     */
    it('should update config and invalidate cache', async () => {
      // ARRANGE
      mockPrismaService.appConfig.findUnique.mockResolvedValue({ id: 1 });
      mockPrismaService.appConfig.update.mockResolvedValue({
        id: 1,
        cosplayLimit: 100,
      });

      // Poblar caché primero
      mockPrismaService.appConfig.findFirst.mockResolvedValue({
        cosplayLimit: 50,
        cosplayGuestLimit: 40,
        karaokeLimit: 30,
      });
      await service.getLimits();

      // ACT
      const result = await service.updateConfig({ cosplayLimit: 100 });

      // ASSERT
      expect(result.cosplayLimit).toBe(100);

      // Verificar que después de update, getLimits hace nueva query
      await service.getLimits();
      // Debería ser 3: 1 del primer getLimits + 1 del segundo getLimits
      expect(mockPrismaService.appConfig.findFirst).toHaveBeenCalledTimes(2);
    });
  });

  // =========================================
  // TESTS PARA: resetConfig() - Resetear config
  // =========================================
  describe('resetConfig', () => {
    /**
     * TEST: Eliminar y crear config por defecto
     */
    it('should delete existing and create default config', async () => {
      // ARRANGE
      mockPrismaService.appConfig.deleteMany.mockResolvedValue({ count: 1 });
      mockPrismaService.appConfig.create.mockResolvedValue({
        id: 1,
        donationsEnabled: true,
      });

      // ACT
      const result = await service.resetConfig();

      // ASSERT
      expect(mockPrismaService.appConfig.deleteMany).toHaveBeenCalled();
      expect(mockPrismaService.appConfig.create).toHaveBeenCalled();
      expect(result.donationsEnabled).toBe(true);
    });
  });
});
