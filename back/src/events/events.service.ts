import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';

@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(page: number = 1, limit: number = 10, upcoming?: boolean) {
    const skip = (page - 1) * limit;
    const where = upcoming === undefined ? {} : { isPast: upcoming ? false : undefined };

    const [events, total] = await Promise.all([
      this.prisma.event.findMany({
        take: limit,
        skip,
        where,
        select: {
          id: true,
          title: true,
          date: true,
          time: true,
          location: true,
          description: true,
          isPast: true,
          isFeatured: true,
          rainCheck: true,
          isFree: true,
          ticketPrice: true,
          ticketLink: true,
          tags: true,
          createdAt: true,
          images: true,
          // NO incluir highlights ni transport (muy pesados)
        },
        orderBy: { date: 'asc' }
      }),
      this.prisma.event.count({ where })
    ]);

    return {
      data: events,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  findOne(id: string) {
    // Aquí SÍ traer todos los datos porque se necesitan para el detalle
    return this.prisma.event.findUnique({ where: { id } });
  }

  create(data: CreateEventDto) {
    return this.prisma.event.create({
      data: {
        ...data,
        tags: data.tags || [],
        images: data.images || [],
      },
    });
  }

  update(id: string, data: UpdateEventDto) {
    return this.prisma.event.update({
      where: { id },
      data,
    });
  }

  delete(id: string) {
    return this.prisma.event.delete({ where: { id } });
  }
}
