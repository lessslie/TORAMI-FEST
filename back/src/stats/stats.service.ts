import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StandStatus, CosplayStatus, GiveawayStatus, GalleryStatus } from '@prisma/client';

@Injectable()
export class StatsService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardStats() {
    const [
      totalUsers,
      totalEvents,
      upcomingEvents,
      totalStands,
      pendingStands,
      approvedStands,
      totalCosplay,
      pendingCosplay,
      confirmedCosplay,
      totalGiveaways,
      activeGiveaways,
      totalGallery,
      pendingGallery,
      approvedGallery,
      totalSponsors,
      activeSponsors,
      totalStamps,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.event.count(),
      this.prisma.event.count({ where: { isPast: false } }),
      this.prisma.standApplication.count(),
      this.prisma.standApplication.count({ where: { status: StandStatus.PENDIENTE } }),
      this.prisma.standApplication.count({ where: { status: StandStatus.APROBADA } }),
      this.prisma.cosplayRegistration.count(),
      this.prisma.cosplayRegistration.count({ where: { status: CosplayStatus.INSCRIPTO } }),
      this.prisma.cosplayRegistration.count({ where: { status: CosplayStatus.CONFIRMADO } }),
      this.prisma.giveaway.count(),
      this.prisma.giveaway.count({ where: { status: GiveawayStatus.ACTIVO } }),
      this.prisma.galleryItem.count(),
      this.prisma.galleryItem.count({ where: { status: GalleryStatus.PENDING } }),
      this.prisma.galleryItem.count({ where: { status: GalleryStatus.APPROVED } }),
      this.prisma.sponsor.count(),
      this.prisma.sponsor.count({ where: { active: true } }),
      this.prisma.stamp.count(),
    ]);

    return {
      users: {
        total: totalUsers,
      },
      events: {
        total: totalEvents,
        upcoming: upcomingEvents,
        past: totalEvents - upcomingEvents,
      },
      stands: {
        total: totalStands,
        pending: pendingStands,
        approved: approvedStands,
        rejected: totalStands - pendingStands - approvedStands,
      },
      cosplay: {
        total: totalCosplay,
        pending: pendingCosplay,
        confirmed: confirmedCosplay,
        rejected: totalCosplay - pendingCosplay - confirmedCosplay,
      },
      giveaways: {
        total: totalGiveaways,
        active: activeGiveaways,
        finished: totalGiveaways - activeGiveaways,
      },
      gallery: {
        total: totalGallery,
        pending: pendingGallery,
        approved: approvedGallery,
        rejected: totalGallery - pendingGallery - approvedGallery,
      },
      sponsors: {
        total: totalSponsors,
        active: activeSponsors,
        inactive: totalSponsors - activeSponsors,
      },
      stamps: {
        total: totalStamps,
      },
    };
  }

  async getUserStats(userId: string) {
    const [
      user,
      stampsCount,
      stampsCollected,
      standsCount,
      cosplayCount,
      giveawaysCount,
      galleryCount,
      unreadNotifications,
    ] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          avatar: true,
          ticketType: true,
          createdAt: true,
        },
      }),
      this.prisma.stamp.count(),
      this.prisma.stamp.count({ where: { userId } }),
      this.prisma.standApplication.count({ where: { userId } }),
      this.prisma.cosplayRegistration.count({ where: { userId } }),
      this.prisma.giveawayParticipant.count({ where: { userId } }),
      this.prisma.galleryItem.count({ where: { userId } }),
      this.prisma.notification.count({ where: { userId, read: false } }),
    ]);

    return {
      user,
      stamps: {
        total: stampsCount,
        collected: stampsCollected,
        percentage: stampsCount > 0 ? Math.round((stampsCollected / stampsCount) * 100) : 0,
      },
      activity: {
        stands: standsCount,
        cosplay: cosplayCount,
        giveaways: giveawaysCount,
        gallery: galleryCount,
        unreadNotifications,
      },
    };
  }

  async getEventStats(eventId: string) {
    const [
      event,
      galleryCount,
      standsCount,
    ] = await Promise.all([
      this.prisma.event.findUnique({
        where: { id: eventId },
      }),
      this.prisma.galleryItem.count({ where: { eventId } }),
      this.prisma.standApplication.count({ where: { eventId } }),
    ]);

    return {
      event,
      gallery: galleryCount,
      stands: standsCount,
    };
  }
}
