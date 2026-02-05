/**
 * ===========================================
 * TEST UNITARIO PARA StatsService
 * ===========================================
 *
 * Este servicio genera estadísticas para el dashboard.
 *
 * TIPOS DE ESTADÍSTICAS:
 * 1. getDashboardStats(): Estadísticas globales para admins
 *    - Total usuarios, eventos, stands, cosplay, etc.
 *    - Conteos por estado (pendiente, aprobado, rechazado)
 *
 * 2. getUserStats(): Estadísticas de un usuario específico
 *    - Stamps coleccionados
 *    - Participaciones en eventos, sorteos, etc.
 *
 * 3. getEventStats(): Estadísticas de un evento específico
 *    - Fotos en galería, stands registrados
 */

import { Test, TestingModule } from '@nestjs/testing';
import { StatsService } from './stats.service';
import { PrismaService } from '../prisma/prisma.service';

describe('StatsService', () => {
  let service: StatsService;

  /**
   * MOCK DE PrismaService
   * ---------------------
   * Este servicio hace MUCHOS counts a diferentes tablas.
   * Simulamos todos los modelos necesarios.
   */
  const mockPrismaService = {
    user: {
      count: jest.fn(),
      findUnique: jest.fn(),
    },
    event: {
      count: jest.fn(),
      findUnique: jest.fn(),
    },
    standApplication: {
      count: jest.fn(),
    },
    cosplayRegistration: {
      count: jest.fn(),
    },
    giveaway: {
      count: jest.fn(),
    },
    giveawayParticipant: {
      count: jest.fn(),
    },
    galleryItem: {
      count: jest.fn(),
    },
    sponsor: {
      count: jest.fn(),
    },
    stamp: {
      count: jest.fn(),
    },
    notification: {
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StatsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<StatsService>(StatsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // =========================================
  // TESTS PARA: getDashboardStats() - Stats del dashboard
  // =========================================
  describe('getDashboardStats', () => {
    /**
     * TEST: Obtener estadísticas completas del dashboard
     * -------------------------------------------------
     * Este método hace 17 queries en paralelo (Promise.all)
     * y devuelve un objeto con todas las estadísticas.
     */
    it('should return complete dashboard statistics', async () => {
      // ARRANGE - Configurar todos los mocks
      // Usuarios
      mockPrismaService.user.count.mockResolvedValue(1500);

      // Eventos (total y upcoming en llamadas separadas)
      mockPrismaService.event.count
        .mockResolvedValueOnce(10)   // total
        .mockResolvedValueOnce(3);   // upcoming (isPast: false)

      // Stands (total, pending, approved en llamadas separadas)
      mockPrismaService.standApplication.count
        .mockResolvedValueOnce(50)   // total
        .mockResolvedValueOnce(15)   // pendiente
        .mockResolvedValueOnce(30);  // aprobada

      // Cosplay (total, inscripto, confirmado)
      mockPrismaService.cosplayRegistration.count
        .mockResolvedValueOnce(40)   // total
        .mockResolvedValueOnce(10)   // inscripto (pendiente)
        .mockResolvedValueOnce(25);  // confirmado

      // Giveaways (total, activos)
      mockPrismaService.giveaway.count
        .mockResolvedValueOnce(5)    // total
        .mockResolvedValueOnce(2);   // activos

      // Gallery (total, pending, approved)
      mockPrismaService.galleryItem.count
        .mockResolvedValueOnce(200)  // total
        .mockResolvedValueOnce(20)   // pending
        .mockResolvedValueOnce(170); // approved

      // Sponsors (total, activos)
      mockPrismaService.sponsor.count
        .mockResolvedValueOnce(8)    // total
        .mockResolvedValueOnce(6);   // activos

      // Stamps
      mockPrismaService.stamp.count.mockResolvedValue(12);

      // ACT
      const result = await service.getDashboardStats();

      // ASSERT - Verificar estructura y cálculos
      expect(result.users.total).toBe(1500);

      expect(result.events.total).toBe(10);
      expect(result.events.upcoming).toBe(3);
      expect(result.events.past).toBe(7);  // 10 - 3

      expect(result.stands.total).toBe(50);
      expect(result.stands.pending).toBe(15);
      expect(result.stands.approved).toBe(30);
      expect(result.stands.rejected).toBe(5);  // 50 - 15 - 30

      expect(result.cosplay.total).toBe(40);
      expect(result.cosplay.pending).toBe(10);
      expect(result.cosplay.confirmed).toBe(25);
      expect(result.cosplay.rejected).toBe(5);  // 40 - 10 - 25

      expect(result.giveaways.total).toBe(5);
      expect(result.giveaways.active).toBe(2);
      expect(result.giveaways.finished).toBe(3);  // 5 - 2

      expect(result.gallery.total).toBe(200);
      expect(result.gallery.pending).toBe(20);
      expect(result.gallery.approved).toBe(170);
      expect(result.gallery.rejected).toBe(10);  // 200 - 20 - 170

      expect(result.sponsors.total).toBe(8);
      expect(result.sponsors.active).toBe(6);
      expect(result.sponsors.inactive).toBe(2);  // 8 - 6

      expect(result.stamps.total).toBe(12);
    });

    /**
     * TEST: Manejar conteos en cero correctamente
     */
    it('should handle zero counts correctly', async () => {
      // ARRANGE - Todo en cero
      mockPrismaService.user.count.mockResolvedValue(0);
      mockPrismaService.event.count.mockResolvedValue(0);
      mockPrismaService.standApplication.count.mockResolvedValue(0);
      mockPrismaService.cosplayRegistration.count.mockResolvedValue(0);
      mockPrismaService.giveaway.count.mockResolvedValue(0);
      mockPrismaService.galleryItem.count.mockResolvedValue(0);
      mockPrismaService.sponsor.count.mockResolvedValue(0);
      mockPrismaService.stamp.count.mockResolvedValue(0);

      // ACT
      const result = await service.getDashboardStats();

      // ASSERT
      expect(result.users.total).toBe(0);
      expect(result.events.total).toBe(0);
      expect(result.stands.rejected).toBe(0);  // 0 - 0 - 0 = 0
    });
  });

  // =========================================
  // TESTS PARA: getUserStats() - Stats de un usuario
  // =========================================
  describe('getUserStats', () => {
    /**
     * TEST: Obtener estadísticas de un usuario
     */
    it('should return user statistics with stamp percentage', async () => {
      // ARRANGE
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'user-1',
        name: 'Juan',
        email: 'juan@test.com',
        role: 'USER',
      });
      mockPrismaService.stamp.count
        .mockResolvedValueOnce(10)   // total stamps en el sistema
        .mockResolvedValueOnce(4);   // stamps coleccionados por el usuario
      mockPrismaService.standApplication.count.mockResolvedValue(2);
      mockPrismaService.cosplayRegistration.count.mockResolvedValue(1);
      mockPrismaService.giveawayParticipant.count.mockResolvedValue(3);
      mockPrismaService.galleryItem.count.mockResolvedValue(5);
      mockPrismaService.notification.count.mockResolvedValue(2);

      // ACT
      const result = await service.getUserStats('user-1');

      // ASSERT
      expect(result.user?.name).toBe('Juan');
      expect(result.stamps.total).toBe(10);
      expect(result.stamps.collected).toBe(4);
      expect(result.stamps.percentage).toBe(40);  // 4/10 * 100 = 40%
      expect(result.activity.stands).toBe(2);
      expect(result.activity.cosplay).toBe(1);
      expect(result.activity.giveaways).toBe(3);
      expect(result.activity.gallery).toBe(5);
      expect(result.activity.unreadNotifications).toBe(2);
    });

    /**
     * TEST: Manejar 0 stamps (evitar división por cero)
     */
    it('should return 0% when no stamps exist in system', async () => {
      // ARRANGE
      mockPrismaService.user.findUnique.mockResolvedValue({ id: 'user-1' });
      mockPrismaService.stamp.count.mockResolvedValue(0);  // No hay stamps
      mockPrismaService.standApplication.count.mockResolvedValue(0);
      mockPrismaService.cosplayRegistration.count.mockResolvedValue(0);
      mockPrismaService.giveawayParticipant.count.mockResolvedValue(0);
      mockPrismaService.galleryItem.count.mockResolvedValue(0);
      mockPrismaService.notification.count.mockResolvedValue(0);

      // ACT
      const result = await service.getUserStats('user-1');

      // ASSERT
      expect(result.stamps.percentage).toBe(0);  // No debe ser NaN
    });
  });

  // =========================================
  // TESTS PARA: getEventStats() - Stats de un evento
  // =========================================
  describe('getEventStats', () => {
    /**
     * TEST: Obtener estadísticas de un evento
     */
    it('should return event statistics', async () => {
      // ARRANGE
      mockPrismaService.event.findUnique.mockResolvedValue({
        id: 'event-1',
        title: 'Torami Fest 2024',
        date: new Date('2024-12-15'),
      });
      mockPrismaService.galleryItem.count.mockResolvedValue(150);
      mockPrismaService.standApplication.count.mockResolvedValue(25);

      // ACT
      const result = await service.getEventStats('event-1');

      // ASSERT
      expect(result.event?.title).toBe('Torami Fest 2024');
      expect(result.gallery).toBe(150);
      expect(result.stands).toBe(25);
    });
  });
});
