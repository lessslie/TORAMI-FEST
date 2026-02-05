/**
 * ===========================================
 * TEST UNITARIO PARA SponsorsService
 * ===========================================
 *
 * Este servicio maneja los sponsors/patrocinadores del evento.
 *
 * UN SPONSOR TIENE:
 * - name: Nombre del sponsor
 * - logo: URL del logo
 * - website: Sitio web (opcional)
 * - active: Si está activo o no
 *
 * CRUD COMPLETO disponible para administradores.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { SponsorsService } from './sponsors.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('SponsorsService', () => {
  let service: SponsorsService;

  const mockPrismaService = {
    sponsor: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SponsorsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<SponsorsService>(SponsorsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // =========================================
  // TESTS PARA: findAll() - Listar sponsors
  // =========================================
  describe('findAll', () => {
    const mockSponsors = [
      { id: 's1', name: 'Crunchyroll', logo: 'crunchyroll.png', active: true },
      { id: 's2', name: 'Funimation', logo: 'funimation.png', active: true },
      { id: 's3', name: 'Old Sponsor', logo: 'old.png', active: false },
    ];

    /**
     * TEST 1: Obtener todos los sponsors
     */
    it('should return all sponsors ordered by name', async () => {
      // ARRANGE
      mockPrismaService.sponsor.findMany.mockResolvedValue(mockSponsors);

      // ACT
      const result = await service.findAll();

      // ASSERT
      expect(result).toEqual(mockSponsors);
      expect(mockPrismaService.sponsor.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: { name: 'asc' },
      });
    });

    /**
     * TEST 2: Filtrar solo sponsors activos
     */
    it('should return only active sponsors when activeOnly is true', async () => {
      // ARRANGE
      const activeSponsors = mockSponsors.filter(s => s.active);
      mockPrismaService.sponsor.findMany.mockResolvedValue(activeSponsors);

      // ACT
      const result = await service.findAll(true);

      // ASSERT
      expect(mockPrismaService.sponsor.findMany).toHaveBeenCalledWith({
        where: { active: true },
        orderBy: { name: 'asc' },
      });
    });
  });

  // =========================================
  // TESTS PARA: findOne() - Obtener un sponsor
  // =========================================
  describe('findOne', () => {
    /**
     * TEST 1: Sponsor encontrado
     */
    it('should return sponsor when found', async () => {
      // ARRANGE
      const mockSponsor = { id: 's1', name: 'Crunchyroll', logo: 'crunchyroll.png' };
      mockPrismaService.sponsor.findUnique.mockResolvedValue(mockSponsor);

      // ACT
      const result = await service.findOne('s1');

      // ASSERT
      expect(result).toEqual(mockSponsor);
    });

    /**
     * TEST 2: Sponsor no encontrado
     */
    it('should throw NotFoundException when sponsor not found', async () => {
      // ARRANGE
      mockPrismaService.sponsor.findUnique.mockResolvedValue(null);

      // ACT & ASSERT
      await expect(service.findOne('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  // =========================================
  // TESTS PARA: create() - Crear sponsor
  // =========================================
  describe('create', () => {
    /**
     * TEST 1: Crear sponsor con active=true por defecto
     */
    it('should create sponsor with active=true by default', async () => {
      // ARRANGE
      const createDto = {
        name: 'Nuevo Sponsor',
        logoUrl: 'logo.png',
        category: 'Gold',
        link: 'https://sponsor.com',
      };
      mockPrismaService.sponsor.create.mockResolvedValue({
        id: 'new-s',
        ...createDto,
        active: true,
      });

      // ACT
      const result = await service.create(createDto);

      // ASSERT
      expect(result.active).toBe(true);
    });

    /**
     * TEST 2: Crear sponsor inactivo
     */
    it('should allow creating inactive sponsor', async () => {
      // ARRANGE
      const createDto = {
        name: 'Sponsor Inactivo',
        logoUrl: 'logo.png',
        category: 'Silver',
        link: 'https://sponsor.com',
        active: false,
      };
      mockPrismaService.sponsor.create.mockResolvedValue({
        id: 'new-s',
        ...createDto,
      });

      // ACT
      const result = await service.create(createDto);

      // ASSERT
      expect(result.active).toBe(false);
    });
  });

  // =========================================
  // TESTS PARA: update() - Actualizar sponsor
  // =========================================
  describe('update', () => {
    /**
     * TEST: Actualizar sponsor existente
     */
    it('should update sponsor when found', async () => {
      // ARRANGE
      mockPrismaService.sponsor.findUnique.mockResolvedValue({ id: 's1' });
      mockPrismaService.sponsor.update.mockResolvedValue({
        id: 's1',
        name: 'Nombre Actualizado',
      });

      // ACT
      const result = await service.update('s1', { name: 'Nombre Actualizado' });

      // ASSERT
      expect(result.name).toBe('Nombre Actualizado');
    });

    /**
     * TEST: Lanzar error si no existe
     */
    it('should throw NotFoundException if sponsor does not exist', async () => {
      // ARRANGE
      mockPrismaService.sponsor.findUnique.mockResolvedValue(null);

      // ACT & ASSERT
      await expect(service.update('non-existent', { name: 'X' })).rejects.toThrow(NotFoundException);
    });
  });

  // =========================================
  // TESTS PARA: delete() - Eliminar sponsor
  // =========================================
  describe('delete', () => {
    /**
     * TEST: Eliminar sponsor existente
     */
    it('should delete sponsor when found', async () => {
      // ARRANGE
      mockPrismaService.sponsor.findUnique.mockResolvedValue({ id: 's1' });
      mockPrismaService.sponsor.delete.mockResolvedValue({ id: 's1' });

      // ACT
      const result = await service.delete('s1');

      // ASSERT
      expect(mockPrismaService.sponsor.delete).toHaveBeenCalledWith({
        where: { id: 's1' },
      });
    });
  });
});
