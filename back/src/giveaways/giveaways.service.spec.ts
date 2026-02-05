/**
 * ===========================================
 * TEST UNITARIO PARA GiveawaysService
 * ===========================================
 *
 * Este servicio maneja los sorteos/giveaways del evento.
 *
 * ESTADOS DE UN SORTEO:
 * - ACTIVO: Sorteo en curso, aceptando participantes
 * - FINALIZADO: Sorteo terminado
 * - CANCELADO: Sorteo cancelado
 *
 * REGLAS DE NEGOCIO:
 * 1. Un DNI solo puede participar una vez por sorteo
 * 2. El sorteo debe estar ACTIVO e isEnabled para aceptar participantes
 * 3. El sorteo debe estar dentro de las fechas (startDate <= now <= endDate)
 * 4. Las inscripciones globales deben estar abiertas (config)
 */

import { Test, TestingModule } from '@nestjs/testing';
import { GiveawaysService } from './giveaways.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '../config/config.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('GiveawaysService', () => {
  let service: GiveawaysService;

  const mockPrismaService = {
    giveaway: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    giveawayParticipant: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
    },
  };

  const mockConfigService = {
    getInscripcionesFlags: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GiveawaysService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<GiveawaysService>(GiveawaysService);

    // Config por defecto: inscripciones abiertas
    mockConfigService.getInscripcionesFlags.mockResolvedValue({
      giveawaysInscripcionesAbiertas: true,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // =========================================
  // TESTS PARA: findAll() - Listar sorteos
  // =========================================
  describe('findAll', () => {
    it('should return all giveaways with participant count', async () => {
      // ARRANGE
      const mockGiveaways = [
        { id: 'g1', title: 'Sorteo Navideño', _count: { participants: 150 } },
        { id: 'g2', title: 'Sorteo Verano', _count: { participants: 80 } },
      ];
      mockPrismaService.giveaway.findMany.mockResolvedValue(mockGiveaways);

      // ACT
      const result = await service.findAll();

      // ASSERT
      expect(result).toEqual(mockGiveaways);
      // Verificamos que NO trae todos los participantes, solo el conteo
      expect(mockPrismaService.giveaway.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: {
            _count: { select: { participants: true } },
          },
        })
      );
    });
  });

  // =========================================
  // TESTS PARA: findOne() - Obtener un sorteo
  // =========================================
  describe('findOne', () => {
    it('should return giveaway with participants', async () => {
      // ARRANGE
      const mockGiveaway = {
        id: 'g1',
        title: 'Sorteo Navideño',
        participants: [{ id: 'p1', fullName: 'Juan' }],
        _count: { participants: 1 },
      };
      mockPrismaService.giveaway.findUnique.mockResolvedValue(mockGiveaway);

      // ACT
      const result = await service.findOne('g1');

      // ASSERT
      expect(result).toEqual(mockGiveaway);
    });

    it('should throw NotFoundException if giveaway not found', async () => {
      // ARRANGE
      mockPrismaService.giveaway.findUnique.mockResolvedValue(null);

      // ACT & ASSERT
      await expect(service.findOne('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  // =========================================
  // TESTS PARA: findActive() - Sorteo activo actual
  // =========================================
  describe('findActive', () => {
    it('should return active giveaway within date range', async () => {
      // ARRANGE
      const now = new Date();
      const mockGiveaway = {
        id: 'g1',
        title: 'Sorteo Activo',
        status: 'ACTIVO',
        isEnabled: true,
        startDate: new Date(now.getTime() - 86400000),  // Ayer
        endDate: new Date(now.getTime() + 86400000),    // Mañana
      };
      mockPrismaService.giveaway.findFirst.mockResolvedValue(mockGiveaway);

      // ACT
      const result = await service.findActive();

      // ASSERT
      expect(result).toEqual(mockGiveaway);
    });

    it('should return null if no active giveaway', async () => {
      // ARRANGE
      mockPrismaService.giveaway.findFirst.mockResolvedValue(null);

      // ACT
      const result = await service.findActive();

      // ASSERT
      expect(result).toBeNull();
    });
  });

  // =========================================
  // TESTS PARA: create() - Crear sorteo
  // =========================================
  describe('create', () => {
    it('should create a new giveaway with ACTIVO status', async () => {
      // ARRANGE
      const createDto = {
        title: 'Nuevo Sorteo',
        description: 'Descripción del sorteo',
        startDate: '2024-12-01',
        endDate: '2024-12-31',
      };
      const created = { id: 'new-g', ...createDto, status: 'ACTIVO' };
      mockPrismaService.giveaway.create.mockResolvedValue(created);

      // ACT
      const result = await service.create(createDto);

      // ASSERT
      expect(result.status).toBe('ACTIVO');
    });
  });

  // =========================================
  // TESTS PARA: participate() - Inscribirse al sorteo
  // =========================================
  describe('participate', () => {
    const participantDto = {
      fullName: 'Juan Pérez',
      birthDate: '1990-05-15',
      dni: '12345678',
      whatsapp: '1122334455',
      email: 'juan@test.com',
      instagram: '@juanperez',
    };

    const mockActiveGiveaway = {
      id: 'g1',
      status: 'ACTIVO',
      isEnabled: true,
      startDate: new Date(Date.now() - 86400000),  // Ayer
      endDate: new Date(Date.now() + 86400000),    // Mañana
    };

    /**
     * TEST 1: Inscripción exitosa
     */
    it('should allow participation when all conditions are met', async () => {
      // ARRANGE
      mockPrismaService.giveaway.findUnique.mockResolvedValue(mockActiveGiveaway);
      mockPrismaService.giveawayParticipant.findUnique.mockResolvedValue(null);  // DNI no registrado
      mockPrismaService.giveawayParticipant.create.mockResolvedValue({ id: 'p1' });

      // ACT
      const result = await service.participate('g1', participantDto);

      // ASSERT
      expect(result).toEqual({ message: 'Inscripción exitosa', success: true });
    });

    /**
     * TEST 2: Rechazar si inscripciones globales cerradas
     */
    it('should throw if global inscriptions are closed', async () => {
      // ARRANGE
      mockConfigService.getInscripcionesFlags.mockResolvedValue({
        giveawaysInscripcionesAbiertas: false,
      });

      // ACT & ASSERT
      await expect(service.participate('g1', participantDto)).rejects.toThrow(BadRequestException);
      await expect(service.participate('g1', participantDto)).rejects.toThrow(
        'Las inscripciones de sorteos están cerradas'
      );
    });

    /**
     * TEST 3: Rechazar si sorteo no está activo
     */
    it('should throw if giveaway is not ACTIVO', async () => {
      // ARRANGE
      mockPrismaService.giveaway.findUnique.mockResolvedValue({
        ...mockActiveGiveaway,
        status: 'FINALIZADO',
      });

      // ACT & ASSERT
      await expect(service.participate('g1', participantDto)).rejects.toThrow(BadRequestException);
      await expect(service.participate('g1', participantDto)).rejects.toThrow(
        'Este sorteo no está activo'
      );
    });

    /**
     * TEST 4: Rechazar si sorteo deshabilitado
     */
    it('should throw if giveaway isEnabled is false', async () => {
      // ARRANGE
      mockPrismaService.giveaway.findUnique.mockResolvedValue({
        ...mockActiveGiveaway,
        isEnabled: false,
      });

      // ACT & ASSERT
      await expect(service.participate('g1', participantDto)).rejects.toThrow(BadRequestException);
      await expect(service.participate('g1', participantDto)).rejects.toThrow(
        'Las inscripciones para este sorteo están cerradas'
      );
    });

    /**
     * TEST 5: Rechazar si sorteo no ha comenzado
     */
    it('should throw if giveaway has not started yet', async () => {
      // ARRANGE
      mockPrismaService.giveaway.findUnique.mockResolvedValue({
        ...mockActiveGiveaway,
        startDate: new Date(Date.now() + 86400000 * 7),  // En 7 días
      });

      // ACT & ASSERT
      await expect(service.participate('g1', participantDto)).rejects.toThrow(BadRequestException);
      await expect(service.participate('g1', participantDto)).rejects.toThrow(
        'Este sorteo aún no ha comenzado'
      );
    });

    /**
     * TEST 6: Rechazar si sorteo ya terminó
     */
    it('should throw if giveaway has ended', async () => {
      // ARRANGE
      mockPrismaService.giveaway.findUnique.mockResolvedValue({
        ...mockActiveGiveaway,
        endDate: new Date(Date.now() - 86400000),  // Ayer
      });

      // ACT & ASSERT
      await expect(service.participate('g1', participantDto)).rejects.toThrow(BadRequestException);
      await expect(service.participate('g1', participantDto)).rejects.toThrow(
        'Este sorteo ya ha finalizado'
      );
    });

    /**
     * TEST 7: Rechazar DNI duplicado
     */
    it('should throw if DNI is already registered', async () => {
      // ARRANGE
      mockPrismaService.giveaway.findUnique.mockResolvedValue(mockActiveGiveaway);
      mockPrismaService.giveawayParticipant.findUnique.mockResolvedValue({
        id: 'existing',
        dni: '12345678',
      });

      // ACT & ASSERT
      await expect(service.participate('g1', participantDto)).rejects.toThrow(BadRequestException);
      await expect(service.participate('g1', participantDto)).rejects.toThrow(
        'Ya te inscribiste a este sorteo con este DNI'
      );
    });
  });

  // =========================================
  // TESTS PARA: checkDni() - Verificar DNI
  // =========================================
  describe('checkDni', () => {
    it('should return isRegistered true if DNI exists', async () => {
      // ARRANGE
      mockPrismaService.giveawayParticipant.findUnique.mockResolvedValue({ id: 'p1' });

      // ACT
      const result = await service.checkDni('g1', '12345678');

      // ASSERT
      expect(result).toEqual({ isRegistered: true });
    });

    it('should return isRegistered false if DNI does not exist', async () => {
      // ARRANGE
      mockPrismaService.giveawayParticipant.findUnique.mockResolvedValue(null);

      // ACT
      const result = await service.checkDni('g1', '12345678');

      // ASSERT
      expect(result).toEqual({ isRegistered: false });
    });
  });

  // =========================================
  // TESTS PARA: delete() - Eliminar sorteo
  // =========================================
  describe('delete', () => {
    it('should delete a giveaway', async () => {
      // ARRANGE
      mockPrismaService.giveaway.findUnique.mockResolvedValue({ id: 'g1' });
      mockPrismaService.giveaway.delete.mockResolvedValue({ id: 'g1' });

      // ACT
      const result = await service.delete('g1');

      // ASSERT
      expect(mockPrismaService.giveaway.delete).toHaveBeenCalledWith({
        where: { id: 'g1' },
      });
    });
  });
});
