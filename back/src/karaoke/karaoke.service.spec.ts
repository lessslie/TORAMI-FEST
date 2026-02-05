/**
 * ===========================================
 * TEST UNITARIO PARA KaraokeService
 * ===========================================
 *
 * Este servicio maneja las inscripciones al karaoke del evento.
 *
 * ESTADOS DE INSCRIPCIÓN:
 * - PENDIENTE: Inscrito, esperando aprobación
 * - APROBADO: Confirmado con número asignado
 * - RECHAZADO: No participa (no ocupa cupo)
 *
 * REGLAS DE NEGOCIO:
 * 1. Hay un límite de cupos configurable (ej: 30 participantes)
 * 2. Un usuario solo puede inscribirse una vez por evento
 * 3. Al aprobar, se asigna un número de participante único
 * 4. Al rechazar, se libera el número asignado
 */

import { Test, TestingModule } from '@nestjs/testing';
import { KaraokeService } from './karaoke.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '../config/config.service';
import { BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';

describe('KaraokeService', () => {
  let service: KaraokeService;

  const mockPrismaService = {
    karaoke: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    event: {
      findUnique: jest.fn(),
    },
  };

  const mockConfigService = {
    getLimits: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KaraokeService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<KaraokeService>(KaraokeService);

    // Configuración por defecto: 30 cupos de karaoke
    mockConfigService.getLimits.mockResolvedValue({ karaokeLimit: 30 });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // =========================================
  // TESTS PARA: findAll() - Listar inscripciones
  // =========================================
  describe('findAll', () => {
    it('should return all karaoke registrations', async () => {
      // ARRANGE
      const mockRegistrations = [
        { id: 'k1', songName: 'Cruel Angel Thesis', artistName: 'Yoko Takahashi' },
      ];
      mockPrismaService.karaoke.findMany.mockResolvedValue(mockRegistrations);

      // ACT
      const result = await service.findAll();

      // ASSERT
      expect(result).toEqual(mockRegistrations);
    });

    it('should filter by eventId when provided', async () => {
      // ARRANGE
      mockPrismaService.karaoke.findMany.mockResolvedValue([]);

      // ACT
      await service.findAll('event-123');

      // ASSERT
      expect(mockPrismaService.karaoke.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { eventId: 'event-123' },
        })
      );
    });
  });

  // =========================================
  // TESTS PARA: findOne() - Obtener inscripción
  // =========================================
  describe('findOne', () => {
    it('should return karaoke registration with user and event', async () => {
      // ARRANGE
      const mockKaraoke = {
        id: 'k1',
        songName: 'Butter-Fly',
        user: { id: 'u1', name: 'Ana' },
        event: { id: 'e1', title: 'Torami Fest' },
      };
      mockPrismaService.karaoke.findUnique.mockResolvedValue(mockKaraoke);

      // ACT
      const result = await service.findOne('k1');

      // ASSERT
      expect(result).toEqual(mockKaraoke);
    });

    it('should throw NotFoundException if not found', async () => {
      // ARRANGE
      mockPrismaService.karaoke.findUnique.mockResolvedValue(null);

      // ACT & ASSERT
      await expect(service.findOne('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  // =========================================
  // TESTS PARA: getAvailableSlots() - Cupos disponibles
  // =========================================
  describe('getAvailableSlots', () => {
    /**
     * TEST 1: Calcular cupos correctamente
     * Si hay 30 cupos y 10 ocupados → 20 disponibles
     */
    it('should calculate available slots correctly', async () => {
      // ARRANGE
      mockPrismaService.karaoke.count.mockResolvedValue(10);

      // ACT
      const result = await service.getAvailableSlots('event-1');

      // ASSERT
      expect(result).toEqual({
        available: 20,   // 30 - 10
        limit: 30,
        occupied: 10,
      });
    });

    /**
     * TEST 2: No devolver números negativos
     */
    it('should return 0 available when full', async () => {
      // ARRANGE
      mockPrismaService.karaoke.count.mockResolvedValue(30);

      // ACT
      const result = await service.getAvailableSlots('event-1');

      // ASSERT
      expect(result.available).toBe(0);
    });
  });

  // =========================================
  // TESTS PARA: create() - Crear inscripción
  // =========================================
  describe('create', () => {
    const createDto = {
      songName: 'Unravel',
      artistName: 'TK from Ling tosite sigure',
      eventId: 'event-1',
      fullName: 'Juan Pérez',
      instagram: '@juanperez',
      email: 'juan@test.com',
      whatsapp: '1122334455',
    };

    /**
     * TEST 1: Crear inscripción exitosamente
     */
    it('should create karaoke registration with PENDIENTE status', async () => {
      // ARRANGE
      mockPrismaService.event.findUnique.mockResolvedValue({ id: 'event-1' });
      mockPrismaService.karaoke.findFirst.mockResolvedValue(null);
      const created = { id: 'new-k', ...createDto, status: 'PENDIENTE' };
      mockPrismaService.karaoke.create.mockResolvedValue(created);

      // ACT
      const result = await service.create('user-1', createDto);

      // ASSERT
      expect(result.status).toBe('PENDIENTE');
    });

    /**
     * TEST 2: Rechazar si el evento no existe
     */
    it('should throw BadRequestException if event not found', async () => {
      // ARRANGE
      mockPrismaService.event.findUnique.mockResolvedValue(null);

      // ACT & ASSERT
      await expect(service.create('user-1', createDto)).rejects.toThrow(BadRequestException);
      await expect(service.create('user-1', createDto)).rejects.toThrow('Evento no encontrado');
    });

    /**
     * TEST 3: Rechazar si ya está inscrito
     */
    it('should throw BadRequestException if already registered', async () => {
      // ARRANGE
      mockPrismaService.event.findUnique.mockResolvedValue({ id: 'event-1' });
      mockPrismaService.karaoke.findFirst.mockResolvedValue({ id: 'existing' });

      // ACT & ASSERT
      await expect(service.create('user-1', createDto)).rejects.toThrow(BadRequestException);
      await expect(service.create('user-1', createDto)).rejects.toThrow(
        'Ya estás inscrito en el karaoke de este evento'
      );
    });
  });

  // =========================================
  // TESTS PARA: updateStatus() - Cambiar estado
  // =========================================
  describe('updateStatus', () => {
    /**
     * TEST 1: Aprobar y asignar número
     */
    it('should assign number when approving', async () => {
      // ARRANGE
      mockPrismaService.karaoke.findUnique.mockResolvedValue({
        id: 'k1',
        eventId: 'event-1',
        status: 'PENDIENTE',
      });
      mockPrismaService.karaoke.count.mockResolvedValue(5);  // 5 ocupados de 30
      mockPrismaService.karaoke.findMany.mockResolvedValue([
        { assignedNumber: 1 },
        { assignedNumber: 2 },
      ]);
      mockPrismaService.karaoke.update.mockResolvedValue({
        id: 'k1',
        status: 'APROBADO',
        assignedNumber: 3,  // Siguiente número disponible
      });

      // ACT
      const result = await service.updateStatus('k1', 'APROBADO' as any);

      // ASSERT
      expect(result.status).toBe('APROBADO');
      expect(result.assignedNumber).toBe(3);
    });

    /**
     * TEST 2: Rechazar y quitar número
     */
    it('should remove assigned number when rejecting', async () => {
      // ARRANGE
      mockPrismaService.karaoke.findUnique.mockResolvedValue({
        id: 'k1',
        status: 'APROBADO',
        assignedNumber: 5,
      });
      mockPrismaService.karaoke.update.mockResolvedValue({
        id: 'k1',
        status: 'RECHAZADO',
        assignedNumber: null,
      });

      // ACT
      const result = await service.updateStatus('k1', 'RECHAZADO' as any);

      // ASSERT
      expect(result.status).toBe('RECHAZADO');
      expect(result.assignedNumber).toBeNull();
    });

    /**
     * TEST 3: No aprobar si no hay cupos
     */
    it('should throw BadRequestException if no slots available when approving', async () => {
      // ARRANGE
      mockPrismaService.karaoke.findUnique.mockResolvedValue({
        id: 'k1',
        eventId: 'event-1',
        status: 'PENDIENTE',
      });
      mockPrismaService.karaoke.count.mockResolvedValue(30);  // Todos ocupados

      // ACT & ASSERT
      await expect(service.updateStatus('k1', 'APROBADO' as any)).rejects.toThrow(BadRequestException);
    });
  });

  // =========================================
  // TESTS PARA: withdraw() - Cancelar inscripción
  // =========================================
  describe('withdraw', () => {
    /**
     * TEST 1: Cancelar propia inscripción
     */
    it('should allow user to withdraw their own registration', async () => {
      // ARRANGE
      mockPrismaService.karaoke.findUnique.mockResolvedValue({
        id: 'k1',
        userId: 'user-1',
      });
      mockPrismaService.karaoke.delete.mockResolvedValue({ id: 'k1' });

      // ACT
      const result = await service.withdraw('k1', 'user-1');

      // ASSERT
      expect(mockPrismaService.karaoke.delete).toHaveBeenCalledWith({
        where: { id: 'k1' },
      });
    });

    /**
     * TEST 2: No permitir cancelar inscripción ajena
     */
    it('should throw ForbiddenException if trying to withdraw others registration', async () => {
      // ARRANGE
      mockPrismaService.karaoke.findUnique.mockResolvedValue({
        id: 'k1',
        userId: 'other-user',
      });

      // ACT & ASSERT
      await expect(service.withdraw('k1', 'user-1')).rejects.toThrow(ForbiddenException);
    });
  });

  // =========================================
  // TESTS PARA: findAllForExport()
  // =========================================
  describe('findAllForExport', () => {
    it('should return registrations ordered by assignedNumber', async () => {
      // ARRANGE
      mockPrismaService.karaoke.findMany.mockResolvedValue([
        { id: 'k1', assignedNumber: 1 },
        { id: 'k2', assignedNumber: 2 },
      ]);

      // ACT
      await service.findAllForExport();

      // ASSERT
      expect(mockPrismaService.karaoke.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: [
            { assignedNumber: 'asc' },
            { createdAt: 'desc' },
          ],
        })
      );
    });
  });
});
