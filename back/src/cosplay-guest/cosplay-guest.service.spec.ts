/**
 * ===========================================
 * TEST UNITARIO PARA CosplayGuestService
 * ===========================================
 *
 * Este servicio maneja las inscripciones de cosplayers invitados.
 * Es similar a CosplayService pero para cosplayers especiales/invitados.
 *
 * DIFERENCIAS CON CosplayService:
 * - Tiene un límite separado (cosplayGuestLimit)
 * - Los guests pueden tener website, instagram adicionales
 * - Proceso de confirmación similar pero separado
 *
 * ESTADOS:
 * - INSCRIPTO: Inscrito, esperando confirmación
 * - CONFIRMADO: Confirmado para participar
 * - RECHAZADO: No participa
 * - RETIRADO: Se retiró voluntariamente
 */

import { Test, TestingModule } from '@nestjs/testing';
import { CosplayGuestService } from './cosplay-guest.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '../config/config.service';
import { NotFoundException } from '@nestjs/common';

describe('CosplayGuestService', () => {
  let service: CosplayGuestService;

  const mockPrismaService = {
    cosplayGuest: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  };

  const mockConfigService = {
    getLimits: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CosplayGuestService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<CosplayGuestService>(CosplayGuestService);

    // Configuración por defecto: 30 cupos para guests
    mockConfigService.getLimits.mockResolvedValue({ cosplayGuestLimit: 30 });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // =========================================
  // TESTS PARA: findAll() - Listar guests
  // =========================================
  describe('findAll', () => {
    it('should return paginated list of cosplay guests', async () => {
      // ARRANGE
      const mockGuests = [
        { id: 'g1', participantName: 'Guest 1', characterName: 'Saber' },
        { id: 'g2', participantName: 'Guest 2', characterName: 'Archer' },
      ];
      mockPrismaService.cosplayGuest.findMany.mockResolvedValue(mockGuests);
      mockPrismaService.cosplayGuest.count.mockResolvedValue(2);

      // ACT
      const result = await service.findAll(1, 20);

      // ASSERT
      expect(result.data).toEqual(mockGuests);
      expect(result.pagination.total).toBe(2);
      expect(result.pagination.page).toBe(1);
    });

    it('should handle invalid page/limit values safely', async () => {
      // ARRANGE
      mockPrismaService.cosplayGuest.findMany.mockResolvedValue([]);
      mockPrismaService.cosplayGuest.count.mockResolvedValue(0);

      // ACT - Pasar valores inválidos
      const result = await service.findAll(-1, 0);

      // ASSERT - Debe usar valores por defecto seguros
      expect(result.pagination.page).toBe(1);  // Corregido a 1
      expect(result.pagination.limit).toBe(20); // Corregido a 20
    });
  });

  // =========================================
  // TESTS PARA: findOne() - Obtener un guest
  // =========================================
  describe('findOne', () => {
    it('should return cosplay guest with user and event', async () => {
      // ARRANGE
      const mockGuest = {
        id: 'g1',
        participantName: 'Guest Famoso',
        characterName: 'Goku',
        user: { id: 'u1', name: 'Usuario' },
        event: { id: 'e1', title: 'Torami Fest' },
      };
      mockPrismaService.cosplayGuest.findUnique.mockResolvedValue(mockGuest);

      // ACT
      const result = await service.findOne('g1');

      // ASSERT
      expect(result).toEqual(mockGuest);
    });

    it('should throw NotFoundException if guest not found', async () => {
      // ARRANGE
      mockPrismaService.cosplayGuest.findUnique.mockResolvedValue(null);

      // ACT & ASSERT
      await expect(service.findOne('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  // =========================================
  // TESTS PARA: findByUser() - Guests de un usuario
  // =========================================
  describe('findByUser', () => {
    it('should return all cosplay guests for a user', async () => {
      // ARRANGE
      const userGuests = [
        { id: 'g1', participantName: 'Mi Cosplay', userId: 'user-1' },
      ];
      mockPrismaService.cosplayGuest.findMany.mockResolvedValue(userGuests);

      // ACT
      const result = await service.findByUser('user-1');

      // ASSERT
      expect(result).toEqual(userGuests);
      expect(mockPrismaService.cosplayGuest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-1' },
        })
      );
    });
  });

  // =========================================
  // TESTS PARA: getAvailableSlots() - Cupos disponibles
  // =========================================
  describe('getAvailableSlots', () => {
    /**
     * TEST 1: Calcular cupos correctamente
     */
    it('should calculate available slots correctly', async () => {
      // ARRANGE
      mockConfigService.getLimits.mockResolvedValue({ cosplayGuestLimit: 30 });
      mockPrismaService.cosplayGuest.count.mockResolvedValue(12);  // 12 activos

      // ACT
      const result = await service.getAvailableSlots();

      // ASSERT
      expect(result.available).toBe(18);  // 30 - 12
      expect(result.limit).toBe(30);
    });

    /**
     * TEST 2: No devolver números negativos
     */
    it('should return 0 when all slots are taken', async () => {
      // ARRANGE
      mockConfigService.getLimits.mockResolvedValue({ cosplayGuestLimit: 30 });
      mockPrismaService.cosplayGuest.count.mockResolvedValue(35);  // Más que el límite

      // ACT
      const result = await service.getAvailableSlots();

      // ASSERT
      expect(result.available).toBe(0);  // Max(0, 30-35) = 0
    });
  });
});
