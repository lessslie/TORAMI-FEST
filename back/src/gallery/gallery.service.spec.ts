/**
 * ===========================================
 * TEST UNITARIO PARA GalleryService
 * ===========================================
 *
 * Este servicio maneja la galería de fotos del evento.
 *
 * ESTADOS DE UNA FOTO:
 * - PENDING: Subida por usuario, esperando aprobación
 * - APPROVED: Aprobada, visible en la galería pública
 * - REJECTED: Rechazada, no visible públicamente
 *
 * TIPOS DE FOTOS:
 * - isOfficial: true  → Fotos oficiales subidas por admins
 * - isOfficial: false → Fotos subidas por usuarios
 *
 * PERMISOS:
 * - Usuarios: Solo pueden eliminar sus propias fotos (no oficiales)
 * - Admins: Pueden eliminar cualquier foto, aprobar/rechazar
 */

import { Test, TestingModule } from '@nestjs/testing';
import { GalleryService } from './gallery.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('GalleryService', () => {
  let service: GalleryService;

  const mockPrismaService = {
    galleryItem: {
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
        GalleryService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<GalleryService>(GalleryService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // =========================================
  // TESTS PARA: findAll() - Listar fotos
  // =========================================
  describe('findAll', () => {
    it('should return paginated gallery items', async () => {
      // ARRANGE
      const mockItems = [
        { id: 'g1', url: 'photo1.jpg', status: 'APPROVED' },
        { id: 'g2', url: 'photo2.jpg', status: 'PENDING' },
      ];
      mockPrismaService.galleryItem.findMany.mockResolvedValue(mockItems);
      mockPrismaService.galleryItem.count.mockResolvedValue(2);

      // ACT
      const result = await service.findAll(1, 20);

      // ASSERT
      expect(result.data).toEqual(mockItems);
      expect(result.pagination.total).toBe(2);
    });

    it('should filter by eventId when provided', async () => {
      // ARRANGE
      mockPrismaService.galleryItem.findMany.mockResolvedValue([]);
      mockPrismaService.galleryItem.count.mockResolvedValue(0);

      // ACT
      await service.findAll(1, 20, 'event-1');

      // ASSERT
      expect(mockPrismaService.galleryItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ eventId: 'event-1' }),
        })
      );
    });

    it('should filter by status when provided', async () => {
      // ARRANGE
      mockPrismaService.galleryItem.findMany.mockResolvedValue([]);
      mockPrismaService.galleryItem.count.mockResolvedValue(0);

      // ACT
      await service.findAll(1, 20, undefined, 'APPROVED');

      // ASSERT
      expect(mockPrismaService.galleryItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'APPROVED' }),
        })
      );
    });

    it('should filter by isOfficial when provided', async () => {
      // ARRANGE
      mockPrismaService.galleryItem.findMany.mockResolvedValue([]);
      mockPrismaService.galleryItem.count.mockResolvedValue(0);

      // ACT
      await service.findAll(1, 20, undefined, undefined, true);

      // ASSERT
      expect(mockPrismaService.galleryItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ isOfficial: true }),
        })
      );
    });
  });

  // =========================================
  // TESTS PARA: findOne() - Obtener una foto
  // =========================================
  describe('findOne', () => {
    it('should return gallery item with user and event', async () => {
      // ARRANGE
      const mockItem = {
        id: 'g1',
        url: 'photo.jpg',
        user: { id: 'u1', name: 'Ana' },
        event: { id: 'e1', title: 'Torami Fest' },
      };
      mockPrismaService.galleryItem.findUnique.mockResolvedValue(mockItem);

      // ACT
      const result = await service.findOne('g1');

      // ASSERT
      expect(result).toEqual(mockItem);
    });

    it('should throw NotFoundException if not found', async () => {
      // ARRANGE
      mockPrismaService.galleryItem.findUnique.mockResolvedValue(null);

      // ACT & ASSERT
      await expect(service.findOne('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  // =========================================
  // TESTS PARA: create() - Subir foto de usuario
  // =========================================
  describe('create', () => {
    it('should create gallery item with PENDING status', async () => {
      // ARRANGE
      const createDto = {
        url: 'photo.jpg',
        description: 'Mi cosplay',
        eventId: 'event-1',
      };
      const created = { id: 'new-g', ...createDto, status: 'PENDING', isOfficial: false };
      mockPrismaService.galleryItem.create.mockResolvedValue(created);

      // ACT
      const result = await service.create('user-1', createDto);

      // ASSERT
      expect(result.status).toBe('PENDING');
      expect(result.isOfficial).toBe(false);
    });
  });

  // =========================================
  // TESTS PARA: createOfficial() - Subir foto oficial
  // =========================================
  describe('createOfficial', () => {
    it('should create official gallery item with APPROVED status', async () => {
      // ARRANGE
      const createDto = {
        url: 'official-photo.jpg',
        description: 'Foto oficial del evento',
        eventId: 'event-1',
      };
      const created = { id: 'new-g', ...createDto, status: 'APPROVED', isOfficial: true };
      mockPrismaService.galleryItem.create.mockResolvedValue(created);

      // ACT
      const result = await service.createOfficial('admin-1', createDto);

      // ASSERT
      expect(result.status).toBe('APPROVED');
      expect(result.isOfficial).toBe(true);
    });
  });

  // =========================================
  // TESTS PARA: moderate() - Aprobar/Rechazar foto
  // =========================================
  describe('moderate', () => {
    it('should approve photo and set approvedBy info', async () => {
      // ARRANGE
      mockPrismaService.galleryItem.findUnique.mockResolvedValue({
        id: 'g1',
        status: 'PENDING',
      });
      mockPrismaService.galleryItem.update.mockResolvedValue({
        id: 'g1',
        status: 'APPROVED',
        approved: true,
        approvedBy: 'admin-1',
        approvedByName: 'Admin Juan',
      });

      // ACT
      const result = await service.moderate(
        'g1',
        { status: 'APPROVED' as any },
        'admin-1',
        'Admin Juan'
      );

      // ASSERT
      expect(result.status).toBe('APPROVED');
      expect(result.approved).toBe(true);
      expect(result.approvedByName).toBe('Admin Juan');
    });

    it('should reject photo with feedback', async () => {
      // ARRANGE
      mockPrismaService.galleryItem.findUnique.mockResolvedValue({
        id: 'g1',
        status: 'PENDING',
      });
      mockPrismaService.galleryItem.update.mockResolvedValue({
        id: 'g1',
        status: 'REJECTED',
        approved: false,
        feedback: 'Imagen borrosa',
      });

      // ACT
      const result = await service.moderate(
        'g1',
        { status: 'REJECTED' as any, feedback: 'Imagen borrosa' },
        'admin-1',
        'Admin Juan'
      );

      // ASSERT
      expect(result.status).toBe('REJECTED');
      expect(result.approved).toBe(false);
    });
  });

  // =========================================
  // TESTS PARA: delete() - Eliminar foto
  // =========================================
  describe('delete', () => {
    /**
     * TEST 1: Admin puede eliminar cualquier foto
     */
    it('should allow admin to delete any photo', async () => {
      // ARRANGE
      mockPrismaService.galleryItem.findUnique.mockResolvedValue({
        id: 'g1',
        userId: 'other-user',
        isOfficial: false,
      });
      mockPrismaService.galleryItem.delete.mockResolvedValue({ id: 'g1' });

      // ACT
      await service.delete('g1', 'admin-1', 'ADMIN' as any);

      // ASSERT
      expect(mockPrismaService.galleryItem.delete).toHaveBeenCalled();
    });

    /**
     * TEST 2: Usuario puede eliminar su propia foto
     */
    it('should allow user to delete their own photo', async () => {
      // ARRANGE
      mockPrismaService.galleryItem.findUnique.mockResolvedValue({
        id: 'g1',
        userId: 'user-1',
        isOfficial: false,
      });
      mockPrismaService.galleryItem.delete.mockResolvedValue({ id: 'g1' });

      // ACT
      await service.delete('g1', 'user-1', 'USER' as any);

      // ASSERT
      expect(mockPrismaService.galleryItem.delete).toHaveBeenCalled();
    });

    /**
     * TEST 3: Usuario NO puede eliminar foto de otro
     */
    it('should throw ForbiddenException if user tries to delete others photo', async () => {
      // ARRANGE
      mockPrismaService.galleryItem.findUnique.mockResolvedValue({
        id: 'g1',
        userId: 'other-user',
        isOfficial: false,
      });

      // ACT & ASSERT
      await expect(service.delete('g1', 'user-1', 'USER' as any)).rejects.toThrow(ForbiddenException);
    });

    /**
     * TEST 4: Usuario NO puede eliminar foto oficial
     */
    it('should throw ForbiddenException if user tries to delete official photo', async () => {
      // ARRANGE
      mockPrismaService.galleryItem.findUnique.mockResolvedValue({
        id: 'g1',
        userId: 'user-1',  // Es el dueño...
        isOfficial: true,  // ...pero es oficial
      });

      // ACT & ASSERT
      await expect(service.delete('g1', 'user-1', 'USER' as any)).rejects.toThrow(ForbiddenException);
    });

    /**
     * TEST 5: Admin SÍ puede eliminar foto oficial
     */
    it('should allow admin to delete official photo', async () => {
      // ARRANGE
      mockPrismaService.galleryItem.findUnique.mockResolvedValue({
        id: 'g1',
        userId: 'other-user',
        isOfficial: true,
      });
      mockPrismaService.galleryItem.delete.mockResolvedValue({ id: 'g1' });

      // ACT
      await service.delete('g1', 'admin-1', 'SUPER_ADMIN' as any);

      // ASSERT
      expect(mockPrismaService.galleryItem.delete).toHaveBeenCalled();
    });
  });
});
