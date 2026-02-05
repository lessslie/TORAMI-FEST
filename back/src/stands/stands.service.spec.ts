/**
 * ===========================================
 * TEST UNITARIO PARA StandsService
 * ===========================================
 *
 * Este servicio maneja las solicitudes de stands para el evento.
 * Los stands pueden ser de diferentes tipos: Merch, Comida, etc.
 *
 * ESTADOS DE UN STAND:
 * - PENDIENTE: Recién creado, esperando aprobación
 * - APROBADA: Stand confirmado para el evento
 * - RECHAZADA: Stand no aceptado
 *
 * REGLA DE NEGOCIO IMPORTANTE:
 * Un usuario solo puede tener UNA solicitud activa (no rechazada) por evento.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { StandsService } from './stands.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException } from '@nestjs/common';

describe('StandsService', () => {
  let service: StandsService;
  let prisma: PrismaService;

  /**
   * MOCK DE PrismaService
   * ---------------------
   * Simulamos todas las operaciones de base de datos.
   * standApplication es la tabla donde se guardan las solicitudes.
   */
  const mockPrismaService = {
    standApplication: {
      findMany: jest.fn(),    // Buscar múltiples stands
      findUnique: jest.fn(),  // Buscar un stand por ID
      findFirst: jest.fn(),   // Buscar el primer stand que coincida
      create: jest.fn(),      // Crear nuevo stand
      update: jest.fn(),      // Actualizar stand
      delete: jest.fn(),      // Eliminar stand
      count: jest.fn(),       // Contar stands (para paginación)
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StandsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<StandsService>(StandsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // =========================================
  // TESTS PARA: findAll() - Listar stands con paginación
  // =========================================
  describe('findAll', () => {
    /**
     * Datos mock para simular stands en la base de datos
     */
    const mockStands = [
      {
        id: 'stand-1',
        brandName: 'Tienda Kawaii',
        type: 'Merch',
        status: 'PENDIENTE',
        contactName: 'Juan',
        email: 'juan@test.com',
        phone: '123456789',
        event: { id: 'event-1', title: 'Torami Fest 2024', date: new Date() },
      },
      {
        id: 'stand-2',
        brandName: 'Ramen House',
        type: 'Comida',
        status: 'APROBADA',
        contactName: 'María',
        email: 'maria@test.com',
        phone: '987654321',
        event: { id: 'event-1', title: 'Torami Fest 2024', date: new Date() },
      },
    ];

    /**
     * TEST 1: Obtener lista paginada de stands
     * ----------------------------------------
     * Verificamos que devuelve los datos con el formato correcto
     * incluyendo información de paginación.
     */
    it('should return paginated list of stands', async () => {
      // ARRANGE
      mockPrismaService.standApplication.findMany.mockResolvedValue(mockStands);
      mockPrismaService.standApplication.count.mockResolvedValue(2);

      // ACT
      const result = await service.findAll(1, 20);

      // ASSERT
      expect(result).toEqual({
        data: mockStands,
        pagination: {
          total: 2,
          page: 1,
          limit: 20,
          totalPages: 1,  // 2 items / 20 per page = 1 page
        },
      });
      // Verificamos que se llamó findMany con los parámetros correctos
      expect(mockPrismaService.standApplication.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 20,   // limit
          skip: 0,    // (page 1 - 1) * 20 = 0
          where: {},  // sin filtro de status
        })
      );
    });

    /**
     * TEST 2: Filtrar por estado
     * --------------------------
     * Verificamos que cuando se pasa un status, se filtra correctamente.
     */
    it('should filter by status when provided', async () => {
      // ARRANGE
      const pendingStands = [mockStands[0]];
      mockPrismaService.standApplication.findMany.mockResolvedValue(pendingStands);
      mockPrismaService.standApplication.count.mockResolvedValue(1);

      // ACT
      const result = await service.findAll(1, 20, 'PENDIENTE');

      // ASSERT
      expect(mockPrismaService.standApplication.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: 'PENDIENTE' },
        })
      );
      expect(result.data).toHaveLength(1);
    });

    /**
     * TEST 3: Paginación correcta
     * ---------------------------
     * Verificamos que el skip se calcula bien para la página 2.
     */
    it('should calculate correct skip for page 2', async () => {
      // ARRANGE
      mockPrismaService.standApplication.findMany.mockResolvedValue([]);
      mockPrismaService.standApplication.count.mockResolvedValue(25);

      // ACT
      await service.findAll(2, 10);  // Página 2, 10 items por página

      // ASSERT
      expect(mockPrismaService.standApplication.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,  // (page 2 - 1) * 10 = 10
          take: 10,
        })
      );
    });
  });

  // =========================================
  // TESTS PARA: findByUser() - Stands de un usuario
  // =========================================
  describe('findByUser', () => {
    /**
     * TEST: Obtener todos los stands de un usuario específico
     */
    it('should return all stands for a specific user', async () => {
      // ARRANGE
      const userStands = [
        { id: 'stand-1', brandName: 'Mi Stand', userId: 'user-123' },
      ];
      mockPrismaService.standApplication.findMany.mockResolvedValue(userStands);

      // ACT
      const result = await service.findByUser('user-123');

      // ASSERT
      expect(result).toEqual(userStands);
      expect(mockPrismaService.standApplication.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        include: { event: true },
      });
    });
  });

  // =========================================
  // TESTS PARA: findOne() - Obtener un stand por ID
  // =========================================
  describe('findOne', () => {
    /**
     * TEST: Obtener detalles completos de un stand
     */
    it('should return stand with full details including user and event', async () => {
      // ARRANGE
      const mockStand = {
        id: 'stand-1',
        brandName: 'Tienda Kawaii',
        description: 'Vendemos figuras y merchandise',
        images: ['img1.jpg', 'img2.jpg'],
        event: { id: 'event-1', title: 'Torami Fest' },
        user: { id: 'user-1', name: 'Juan', email: 'juan@test.com' },
      };
      mockPrismaService.standApplication.findUnique.mockResolvedValue(mockStand);

      // ACT
      const result = await service.findOne('stand-1');

      // ASSERT
      expect(result).toEqual(mockStand);
      expect(mockPrismaService.standApplication.findUnique).toHaveBeenCalledWith({
        where: { id: 'stand-1' },
        include: {
          event: true,
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      });
    });
  });

  // =========================================
  // TESTS PARA: create() - Crear solicitud de stand
  // =========================================
  describe('create', () => {
    const createDto = {
      brandName: 'Nueva Tienda',
      type: 'Merch',
      contactName: 'Pedro',
      email: 'pedro@test.com',
      phone: '111222333',
      socials: '@nuevatienda',
      description: 'Vendemos anime merchandise',
      needs: 'Mesa grande',
      eventId: 'event-1',
      images: ['photo1.jpg'],
    };

    /**
     * TEST 1: Crear stand exitosamente
     * --------------------------------
     * Verificamos que se crea con estado PENDIENTE por defecto.
     */
    it('should create a new stand application with PENDIENTE status', async () => {
      // ARRANGE
      // No existe solicitud previa para este evento
      mockPrismaService.standApplication.findFirst.mockResolvedValue(null);
      const createdStand = { id: 'new-stand', ...createDto, status: 'PENDIENTE' };
      mockPrismaService.standApplication.create.mockResolvedValue(createdStand);

      // ACT
      const result = await service.create('user-123', createDto);

      // ASSERT
      expect(result).toEqual(createdStand);
      expect(mockPrismaService.standApplication.create).toHaveBeenCalledWith({
        data: {
          ...createDto,
          userId: 'user-123',
          images: ['photo1.jpg'],
          status: 'PENDIENTE',
        },
      });
    });

    /**
     * TEST 2: No permitir duplicados por evento
     * -----------------------------------------
     * REGLA DE NEGOCIO: Un usuario no puede tener 2 solicitudes
     * activas para el mismo evento.
     */
    it('should throw BadRequestException if user already has an active application for this event', async () => {
      // ARRANGE
      // YA existe una solicitud activa (no rechazada) para este evento
      mockPrismaService.standApplication.findFirst.mockResolvedValue({
        id: 'existing-stand',
        status: 'PENDIENTE',
      });

      // ACT & ASSERT
      await expect(service.create('user-123', createDto)).rejects.toThrow(BadRequestException);
      await expect(service.create('user-123', createDto)).rejects.toThrow(
        'Ya tenés una solicitud de stand para este evento.'
      );

      // Verificamos que NO se intentó crear
      expect(mockPrismaService.standApplication.create).not.toHaveBeenCalled();
    });

    /**
     * TEST 3: Permitir nueva solicitud si la anterior fue rechazada
     * -------------------------------------------------------------
     * Si el usuario tiene una solicitud RECHAZADA, puede crear otra.
     */
    it('should allow new application if previous one was rejected', async () => {
      // ARRANGE
      // La búsqueda de solicitud activa no encuentra nada
      // (porque la query excluye las rechazadas)
      mockPrismaService.standApplication.findFirst.mockResolvedValue(null);
      mockPrismaService.standApplication.create.mockResolvedValue({
        id: 'new-stand',
        status: 'PENDIENTE',
      });

      // ACT
      const result = await service.create('user-123', createDto);

      // ASSERT
      expect(result).toBeDefined();
      expect(mockPrismaService.standApplication.create).toHaveBeenCalled();
    });
  });

  // =========================================
  // TESTS PARA: updateStatus() - Cambiar estado del stand
  // =========================================
  describe('updateStatus', () => {
    /**
     * TEST 1: Aprobar un stand
     */
    it('should update stand status to APROBADA', async () => {
      // ARRANGE
      const updatedStand = { id: 'stand-1', status: 'APROBADA' };
      mockPrismaService.standApplication.update.mockResolvedValue(updatedStand);

      // ACT
      const result = await service.updateStatus('stand-1', { status: 'APROBADA' as any });

      // ASSERT
      expect(result).toEqual(updatedStand);
      expect(mockPrismaService.standApplication.update).toHaveBeenCalledWith({
        where: { id: 'stand-1' },
        data: { status: 'APROBADA' },
      });
    });

    /**
     * TEST 2: Rechazar un stand
     */
    it('should update stand status to RECHAZADA', async () => {
      // ARRANGE
      const updatedStand = { id: 'stand-1', status: 'RECHAZADA' };
      mockPrismaService.standApplication.update.mockResolvedValue(updatedStand);

      // ACT
      const result = await service.updateStatus('stand-1', { status: 'RECHAZADA' as any });

      // ASSERT
      expect(result.status).toBe('RECHAZADA');
    });
  });

  // =========================================
  // TESTS PARA: delete() - Eliminar stand
  // =========================================
  describe('delete', () => {
    /**
     * TEST: Eliminar un stand correctamente
     */
    it('should delete a stand application', async () => {
      // ARRANGE
      const deletedStand = { id: 'stand-1', brandName: 'Deleted Stand' };
      mockPrismaService.standApplication.delete.mockResolvedValue(deletedStand);

      // ACT
      const result = await service.delete('stand-1');

      // ASSERT
      expect(result).toEqual(deletedStand);
      expect(mockPrismaService.standApplication.delete).toHaveBeenCalledWith({
        where: { id: 'stand-1' },
      });
    });
  });

  // =========================================
  // TESTS PARA: findAllForExport() - Exportar todos los stands
  // =========================================
  describe('findAllForExport', () => {
    /**
     * TEST: Obtener todos los stands para exportar a PDF
     */
    it('should return all stands for export with default limit of 1000', async () => {
      // ARRANGE
      const allStands = [
        { id: 'stand-1', brandName: 'Stand 1' },
        { id: 'stand-2', brandName: 'Stand 2' },
      ];
      mockPrismaService.standApplication.findMany.mockResolvedValue(allStands);

      // ACT
      const result = await service.findAllForExport();

      // ASSERT
      expect(result).toEqual(allStands);
      expect(mockPrismaService.standApplication.findMany).toHaveBeenCalledWith({
        take: 1000,  // límite por defecto
        include: {
          event: { select: { id: true, title: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
    });

    /**
     * TEST: Respetar límite personalizado
     */
    it('should respect custom limit parameter', async () => {
      // ARRANGE
      mockPrismaService.standApplication.findMany.mockResolvedValue([]);

      // ACT
      await service.findAllForExport(500);

      // ASSERT
      expect(mockPrismaService.standApplication.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 500 })
      );
    });
  });
});
