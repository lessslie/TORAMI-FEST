import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGalleryItemDto } from './dto/create-gallery-item.dto';
import { ModerateGalleryItemDto } from './dto/moderate-gallery-item.dto';
import { GalleryStatus } from '@prisma/client';

@Injectable()
export class GalleryService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId?: string, approved?: boolean) {
    const where: any = {};

    if (userId) {
      where.userId = userId;
    } else if (approved !== undefined) {
      where.approved = approved;
      where.status = GalleryStatus.APPROVED;
    }

    return this.prisma.galleryItem.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        event: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const item = await this.prisma.galleryItem.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        event: true,
      },
    });

    if (!item) {
      throw new NotFoundException('Gallery item not found');
    }

    return item;
  }

  async create(userId: string, data: CreateGalleryItemDto) {
    return this.prisma.galleryItem.create({
      data: {
        ...data,
        userId,
        approved: false,
        status: GalleryStatus.PENDING,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        event: true,
      },
    });
  }

  async moderate(id: string, data: ModerateGalleryItemDto) {
    const item = await this.findOne(id);

    return this.prisma.galleryItem.update({
      where: { id },
      data: {
        status: data.status,
        approved: data.status === GalleryStatus.APPROVED,
        feedback: data.feedback,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        event: true,
      },
    });
  }

  async delete(id: string) {
    const item = await this.findOne(id);
    return this.prisma.galleryItem.delete({ where: { id } });
  }
}
