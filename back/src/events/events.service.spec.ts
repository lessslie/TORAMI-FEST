/**
 * ===========================================
 * TEST UNITARIO PARA EventsService
 * ===========================================
 *
 * Este servicio maneja los eventos de Torami Fest.
 *
 * UN EVENTO CONTIENE:
 * - Información básica: título, fecha, hora, ubicación
 * - Información de tickets: precio, link de compra, si es gratis
 * - Estado: isPast (si ya pasó), isFeatured (destacado)
 * - Media: imágenes, tags
 *
 * CRUD COMPLETO:
 * - Create: Crear nuevo evento
 * - Read: Listar todos o ver uno
 * - Update: Modificar evento existente
 * - Delete: Eliminar evento
 */

import { Test, TestingModule } from '@nestjs/testing';
import { EventsService } from './events.service';
import { PrismaService } from '../prisma/prisma.service';

describe('EventsService', () => {
  let service: EventsService;

  /**
   * MOCK DE PrismaService
   * ---------------------
   * Simulamos la tabla event y sus operaciones CRUD.
   */
  const mockPrismaService = {
    event: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<EventsService>(EventsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // =========================================
  // TESTS PARA: findAll() - Listar eventos
  // =========================================
  describe('findAll', () => {
    const mockEvents = [
      {
        id: 'event-1',
        title: 'Torami Fest 2024',
        date: new Date('2024-12-15'),
        time: '10:00',
        location: 'Centro de Convenciones',
        isPast: false,
        isFeatured: true,
        isFree: false,
        ticketPrice: 5000,
      },
      {
        id: 'event-2',
        title: 'Torami Fest Verano',
        date: new Date('2025-02-20'),
        time: '14:00',
        location: 'Parque Central',
        isPast: false,
        isFeatured: false,
        isFree: true,
        ticketPrice: null,
      },
    ];

    /**
     * TEST 1: Listar todos los eventos con paginación
     */
    it('should return paginated list of events', async () => {
      // ARRANGE
      mockPrismaService.event.findMany.mockResolvedValue(mockEvents);
      mockPrismaService.event.count.mockResolvedValue(2);

      // ACT
      const result = await service.findAll(1, 10);

      // ASSERT
      expect(result.data).toEqual(mockEvents);
      expect(result.pagination).toEqual({
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
    });

    /**
     * TEST 2: Eventos ordenados por fecha ascendente
     * ---------------------------------------------
     * Los próximos eventos deben aparecer primero.
     */
    it('should order events by date ascending', async () => {
      // ARRANGE
      mockPrismaService.event.findMany.mockResolvedValue(mockEvents);
      mockPrismaService.event.count.mockResolvedValue(2);

      // ACT
      await service.findAll();

      // ASSERT
      expect(mockPrismaService.event.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { date: 'asc' },
        })
      );
    });

    /**
     * TEST 3: Paginación correcta en página 2
     */
    it('should calculate correct skip for page 2', async () => {
      // ARRANGE
      mockPrismaService.event.findMany.mockResolvedValue([]);
      mockPrismaService.event.count.mockResolvedValue(15);

      // ACT
      await service.findAll(2, 10);

      // ASSERT
      expect(mockPrismaService.event.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,  // (page 2 - 1) * 10
          take: 10,
        })
      );
    });
  });

  // =========================================
  // TESTS PARA: findOne() - Obtener un evento
  // =========================================
  describe('findOne', () => {
    /**
     * TEST: Obtener evento con todos sus detalles
     */
    it('should return event with full details', async () => {
      // ARRANGE
      const mockEvent = {
        id: 'event-1',
        title: 'Torami Fest 2024',
        description: 'El evento más grande de anime y cosplay',
        highlights: ['Concurso de cosplay', 'Stands de merchandise'],
        transport: 'Línea A estación Centro',
      };
      mockPrismaService.event.findUnique.mockResolvedValue(mockEvent);

      // ACT
      const result = await service.findOne('event-1');

      // ASSERT
      expect(result).toEqual(mockEvent);
      expect(mockPrismaService.event.findUnique).toHaveBeenCalledWith({
        where: { id: 'event-1' },
      });
    });

    /**
     * TEST: Retornar null si el evento no existe
     */
    it('should return null if event not found', async () => {
      // ARRANGE
      mockPrismaService.event.findUnique.mockResolvedValue(null);

      // ACT
      const result = await service.findOne('non-existent');

      // ASSERT
      expect(result).toBeNull();
    });
  });

  // =========================================
  // TESTS PARA: create() - Crear evento
  // =========================================
  describe('create', () => {
    /**
     * TEST 1: Crear evento con todos los campos
     */
    it('should create a new event with provided data', async () => {
      // ARRANGE
      const createDto = {
        title: 'Nuevo Evento',
        date: '2025-06-15',
        time: '11:00',
        location: 'Auditorio Principal',
        description: 'Un nuevo evento increíble',
        isFree: true,
        tags: ['anime', 'gaming'],
        images: ['banner.jpg'],
      };
      const createdEvent = { id: 'new-event', ...createDto };
      mockPrismaService.event.create.mockResolvedValue(createdEvent);

      // ACT
      const result = await service.create(createDto);

      // ASSERT
      expect(result).toEqual(createdEvent);
      expect(mockPrismaService.event.create).toHaveBeenCalledWith({
        data: {
          ...createDto,
          tags: ['anime', 'gaming'],
          images: ['banner.jpg'],
        },
      });
    });

    /**
     * TEST 2: Crear evento con arrays vacíos por defecto
     * -------------------------------------------------
     * Si no se pasan tags o images, deben ser arrays vacíos.
     */
    it('should default tags and images to empty arrays', async () => {
      // ARRANGE
      const createDto = {
        title: 'Evento Simple',
        date: '2025-01-01',
        location: 'Lugar',
      };
      mockPrismaService.event.create.mockResolvedValue({ id: 'event', ...createDto });

      // ACT
      await service.create(createDto as any);

      // ASSERT
      expect(mockPrismaService.event.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tags: [],
          images: [],
        }),
      });
    });
  });

  // =========================================
  // TESTS PARA: update() - Actualizar evento
  // =========================================
  describe('update', () => {
    /**
     * TEST: Actualizar campos de un evento
     */
    it('should update event with provided data', async () => {
      // ARRANGE
      const updateDto = {
        title: 'Título Actualizado',
        ticketPrice: 7500,
      };
      const updatedEvent = { id: 'event-1', ...updateDto };
      mockPrismaService.event.update.mockResolvedValue(updatedEvent);

      // ACT
      const result = await service.update('event-1', updateDto);

      // ASSERT
      expect(result).toEqual(updatedEvent);
      expect(mockPrismaService.event.update).toHaveBeenCalledWith({
        where: { id: 'event-1' },
        data: updateDto,
      });
    });

    /**
     * TEST: Marcar evento como pasado
     */
    it('should mark event as past', async () => {
      // ARRANGE
      mockPrismaService.event.update.mockResolvedValue({ id: 'event-1', isPast: true });

      // ACT
      const result = await service.update('event-1', { isPast: true });

      // ASSERT
      expect(result.isPast).toBe(true);
    });
  });

  // =========================================
  // TESTS PARA: delete() - Eliminar evento
  // =========================================
  describe('delete', () => {
    /**
     * TEST: Eliminar un evento
     */
    it('should delete an event', async () => {
      // ARRANGE
      const deletedEvent = { id: 'event-1', title: 'Evento Eliminado' };
      mockPrismaService.event.delete.mockResolvedValue(deletedEvent);

      // ACT
      const result = await service.delete('event-1');

      // ASSERT
      expect(result).toEqual(deletedEvent);
      expect(mockPrismaService.event.delete).toHaveBeenCalledWith({
        where: { id: 'event-1' },
      });
    });
  });
});
