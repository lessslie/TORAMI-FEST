/**
 * ===========================================
 * TEST UNITARIO PARA CosplayService
 * ===========================================
 *
 * Este servicio maneja las inscripciones al concurso de cosplay.
 *
 * ESTADOS DE UN COSPLAY:
 * - INSCRIPTO: Recién inscrito, ocupando un slot
 * - CONFIRMADO: Confirmado para participar, ocupando un slot
 * - RECHAZADO: No participa, NO ocupa slot
 * - WAITING_LIST: En lista de espera, NO ocupa slot
 *
 * REGLAS DE NEGOCIO:
 * 1. Hay un límite de slots configurables (ej: 50 cosplayers)
 * 2. Solo INSCRIPTO y CONFIRMADO ocupan slots
 * 3. Cuando un slot se libera, se notifica a la lista de espera
 * 4. Un usuario solo puede tener UNA inscripción activa por evento
 */

import { Test, TestingModule } from '@nestjs/testing';
import { CosplayService } from './cosplay.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '../config/config.service';
import { EmailService } from '../email/email.service';
import { BadRequestException } from '@nestjs/common';

describe('CosplayService', () => {
  let service: CosplayService;

  /**
   * MOCK DE PrismaService
   * ---------------------
   * Simulamos la tabla cosplayRegistration y sus operaciones.
   */
  const mockPrismaService = {
    cosplayRegistration: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  };

  /**
   * MOCK DE ConfigService
   * ---------------------
   * Simulamos la obtención de límites de configuración.
   */
  const mockConfigService = {
    getLimits: jest.fn(),
  };

  /**
   * MOCK DE EmailService
   * --------------------
   * Simulamos el envío de emails de notificación.
   */
  const mockEmailService = {
    sendSlotAvailableNotification: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CosplayService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: EmailService, useValue: mockEmailService },
      ],
    }).compile();

    service = module.get<CosplayService>(CosplayService);

    // Configuración por defecto: 50 slots de cosplay
    mockConfigService.getLimits.mockResolvedValue({ cosplayLimit: 50 });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // =========================================
  // TESTS PARA: findAll() - Listar inscripciones con paginación
  // =========================================
  describe('findAll', () => {
    const mockRegistrations = [
      {
        id: 'cosplay-1',
        participantName: 'Ana García',
        nickname: 'SakuraCos',
        characterName: 'Sailor Moon',
        seriesName: 'Sailor Moon',
        status: 'INSCRIPTO',
        event: { id: 'event-1', title: 'Torami Fest 2024' },
      },
    ];

    /**
     * TEST: Lista paginada de inscripciones
     */
    it('should return paginated list of cosplay registrations', async () => {
      // ARRANGE
      mockPrismaService.cosplayRegistration.findMany.mockResolvedValue(mockRegistrations);
      mockPrismaService.cosplayRegistration.count.mockResolvedValue(1);

      // ACT
      const result = await service.findAll(1, 20);

      // ASSERT
      expect(result.data).toEqual(mockRegistrations);
      expect(result.pagination).toEqual({
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      });
    });

    /**
     * TEST: Filtrar por estado
     */
    it('should filter by status when provided', async () => {
      // ARRANGE
      mockPrismaService.cosplayRegistration.findMany.mockResolvedValue([]);
      mockPrismaService.cosplayRegistration.count.mockResolvedValue(0);

      // ACT
      await service.findAll(1, 20, 'CONFIRMADO');

      // ASSERT
      expect(mockPrismaService.cosplayRegistration.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: 'CONFIRMADO' },
        })
      );
    });
  });

  // =========================================
  // TESTS PARA: getAvailableSlots() - Slots disponibles
  // =========================================
  describe('getAvailableSlots', () => {
    /**
     * TEST 1: Calcular slots disponibles correctamente
     * ------------------------------------------------
     * Si el límite es 50 y hay 30 ocupados → 20 disponibles
     */
    it('should calculate available slots correctly', async () => {
      // ARRANGE
      mockConfigService.getLimits.mockResolvedValue({ cosplayLimit: 50 });
      mockPrismaService.cosplayRegistration.count.mockResolvedValue(30);

      // ACT
      const result = await service.getAvailableSlots();

      // ASSERT
      expect(result).toBe(20);  // 50 - 30 = 20
    });

    /**
     * TEST 2: No devolver números negativos
     * ------------------------------------
     * Si hay más ocupados que el límite (raro, pero posible),
     * debe devolver 0, no un número negativo.
     */
    it('should return 0 if slots are overbooked (never negative)', async () => {
      // ARRANGE
      mockConfigService.getLimits.mockResolvedValue({ cosplayLimit: 50 });
      mockPrismaService.cosplayRegistration.count.mockResolvedValue(60);  // Más que el límite

      // ACT
      const result = await service.getAvailableSlots();

      // ASSERT
      expect(result).toBe(0);  // Max(0, 50-60) = 0
    });

    /**
     * TEST 3: Todos los slots libres
     */
    it('should return full limit when no registrations', async () => {
      // ARRANGE
      mockConfigService.getLimits.mockResolvedValue({ cosplayLimit: 50 });
      mockPrismaService.cosplayRegistration.count.mockResolvedValue(0);

      // ACT
      const result = await service.getAvailableSlots();

      // ASSERT
      expect(result).toBe(50);
    });
  });

  // =========================================
  // TESTS PARA: create() - Crear inscripción
  // =========================================
  describe('create', () => {
    const createDto = {
      participantName: 'Juan Pérez',
      nickname: 'NarutoCos',
      whatsapp: '1122334455',
      characterName: 'Naruto',
      seriesName: 'Naruto Shippuden',
      category: 'Individual',
      referenceImage: 'naruto.jpg',
      eventId: 'event-1',
    };

    /**
     * TEST 1: Crear inscripción exitosamente
     */
    it('should create a cosplay registration with INSCRIPTO status', async () => {
      // ARRANGE
      // No tiene inscripción previa
      mockPrismaService.cosplayRegistration.findFirst.mockResolvedValue(null);
      // Hay slots disponibles
      mockPrismaService.cosplayRegistration.count.mockResolvedValue(30);  // 30 de 50
      // Se crea exitosamente
      const created = { id: 'new-cosplay', ...createDto, status: 'INSCRIPTO' };
      mockPrismaService.cosplayRegistration.create.mockResolvedValue(created);

      // ACT
      const result = await service.create('user-123', createDto);

      // ASSERT
      expect(result.status).toBe('INSCRIPTO');
      expect(mockPrismaService.cosplayRegistration.create).toHaveBeenCalledWith({
        data: {
          ...createDto,
          userId: 'user-123',
          status: 'INSCRIPTO',
        },
      });
    });

    /**
     * TEST 2: Rechazar si ya tiene inscripción activa
     * -----------------------------------------------
     * Un usuario no puede inscribirse 2 veces al mismo evento.
     */
    it('should throw BadRequestException if user already has active registration', async () => {
      // ARRANGE
      mockPrismaService.cosplayRegistration.findFirst.mockResolvedValue({
        id: 'existing-registration',
        status: 'INSCRIPTO',
      });

      // ACT & ASSERT
      await expect(service.create('user-123', createDto)).rejects.toThrow(BadRequestException);
      await expect(service.create('user-123', createDto)).rejects.toThrow(
        'Ya estás inscrito en el concurso de cosplay para este evento.'
      );
    });

    /**
     * TEST 3: Rechazar si no hay slots disponibles
     * --------------------------------------------
     * Cuando todos los slots están ocupados, no se puede inscribir.
     */
    it('should throw BadRequestException if no slots available', async () => {
      // ARRANGE
      mockPrismaService.cosplayRegistration.findFirst.mockResolvedValue(null);  // No tiene inscripción
      mockPrismaService.cosplayRegistration.count.mockResolvedValue(50);  // Todos los slots ocupados

      // ACT & ASSERT
      await expect(service.create('user-123', createDto)).rejects.toThrow(BadRequestException);
      await expect(service.create('user-123', createDto)).rejects.toThrow(
        'No hay cupos disponibles. Podés anotarte en la lista de espera.'
      );
    });
  });

  // =========================================
  // TESTS PARA: updateStatus() - Cambiar estado
  // =========================================
  describe('updateStatus', () => {
    /**
     * TEST 1: Confirmar una inscripción
     */
    it('should update status to CONFIRMADO', async () => {
      // ARRANGE
      mockPrismaService.cosplayRegistration.update.mockResolvedValue({
        id: 'cosplay-1',
        status: 'CONFIRMADO',
      });

      // ACT
      const result = await service.updateStatus('cosplay-1', { status: 'CONFIRMADO' as any });

      // ASSERT
      expect(result.status).toBe('CONFIRMADO');
    });

    /**
     * TEST 2: Rechazar y notificar a lista de espera
     * ----------------------------------------------
     * Cuando se rechaza, se libera un slot y se notifica
     * a quienes están en lista de espera.
     */
    it('should notify waiting list when status changes to RECHAZADO', async () => {
      // ARRANGE
      mockPrismaService.cosplayRegistration.update.mockResolvedValue({
        id: 'cosplay-1',
        status: 'RECHAZADO',
      });
      // Hay un slot disponible ahora
      mockPrismaService.cosplayRegistration.count.mockResolvedValue(49);
      // Hay gente en lista de espera
      mockPrismaService.cosplayRegistration.findMany.mockResolvedValue([
        { notifyEmail: 'waiting@test.com', user: { email: 'user@test.com' } },
      ]);
      mockEmailService.sendSlotAvailableNotification.mockResolvedValue(undefined);

      // ACT
      await service.updateStatus('cosplay-1', { status: 'RECHAZADO' as any });

      // ASSERT
      // Verificamos que se intentó notificar a la lista de espera
      expect(mockEmailService.sendSlotAvailableNotification).toHaveBeenCalled();
    });
  });

  // =========================================
  // TESTS PARA: addToWaitingList() - Lista de espera
  // =========================================
  describe('addToWaitingList', () => {
    const waitingDto = {
      participantName: 'María',
      characterName: 'Nezuko',
      seriesName: 'Demon Slayer',
    };

    /**
     * TEST 1: Agregar a lista de espera exitosamente
     */
    it('should add user to waiting list with WAITING_LIST status', async () => {
      // ARRANGE
      mockPrismaService.cosplayRegistration.findFirst.mockResolvedValue(null);
      mockPrismaService.cosplayRegistration.create.mockResolvedValue({
        id: 'waiting-1',
        ...waitingDto,
        status: 'WAITING_LIST',
      });

      // ACT
      const result = await service.addToWaitingList('user-456', waitingDto);

      // ASSERT
      expect(result.status).toBe('WAITING_LIST');
    });

    /**
     * TEST 2: Rechazar si ya tiene inscripción activa o está en espera
     */
    it('should throw BadRequestException if already registered or in waiting list', async () => {
      // ARRANGE
      mockPrismaService.cosplayRegistration.findFirst.mockResolvedValue({
        id: 'existing',
        status: 'WAITING_LIST',
      });

      // ACT & ASSERT
      await expect(service.addToWaitingList('user-456', waitingDto)).rejects.toThrow(BadRequestException);
    });
  });

  // =========================================
  // TESTS PARA: delete() - Eliminar inscripción
  // =========================================
  describe('delete', () => {
    /**
     * TEST 1: Eliminar inscripción activa notifica a lista de espera
     * -------------------------------------------------------------
     * Si eliminamos un INSCRIPTO o CONFIRMADO, se libera un slot.
     */
    it('should notify waiting list when deleting an active registration', async () => {
      // ARRANGE
      mockPrismaService.cosplayRegistration.findUnique.mockResolvedValue({
        id: 'cosplay-1',
        status: 'INSCRIPTO',  // Ocupaba un slot
      });
      mockPrismaService.cosplayRegistration.delete.mockResolvedValue({ id: 'cosplay-1' });
      mockPrismaService.cosplayRegistration.count.mockResolvedValue(49);  // Ahora hay 1 slot libre
      mockPrismaService.cosplayRegistration.findMany.mockResolvedValue([
        { notifyEmail: 'waiting@test.com', user: { email: 'user@test.com' } },
      ]);
      mockEmailService.sendSlotAvailableNotification.mockResolvedValue(undefined);

      // ACT
      await service.delete('cosplay-1');

      // ASSERT
      expect(mockEmailService.sendSlotAvailableNotification).toHaveBeenCalled();
    });

    /**
     * TEST 2: Eliminar de lista de espera NO notifica
     * -----------------------------------------------
     * Si eliminamos alguien de WAITING_LIST, no se libera un slot.
     */
    it('should NOT notify waiting list when deleting from waiting list', async () => {
      // ARRANGE
      mockPrismaService.cosplayRegistration.findUnique.mockResolvedValue({
        id: 'waiting-1',
        status: 'WAITING_LIST',  // No ocupaba slot
      });
      mockPrismaService.cosplayRegistration.delete.mockResolvedValue({ id: 'waiting-1' });

      // ACT
      await service.delete('waiting-1');

      // ASSERT
      // NO se debe llamar a notificar porque no se liberó un slot
      expect(mockEmailService.sendSlotAvailableNotification).not.toHaveBeenCalled();
    });
  });

  // =========================================
  // TESTS PARA: findAllForExport() - Exportar inscripciones
  // =========================================
  describe('findAllForExport', () => {
    it('should return all registrations for export', async () => {
      // ARRANGE
      const allRegistrations = [
        { id: 'cosplay-1', participantName: 'Ana' },
        { id: 'cosplay-2', participantName: 'Juan' },
      ];
      mockPrismaService.cosplayRegistration.findMany.mockResolvedValue(allRegistrations);

      // ACT
      const result = await service.findAllForExport();

      // ASSERT
      expect(result).toEqual(allRegistrations);
      expect(mockPrismaService.cosplayRegistration.findMany).toHaveBeenCalledWith({
        take: 1000,
        include: {
          event: { select: { id: true, title: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
    });
  });
});
