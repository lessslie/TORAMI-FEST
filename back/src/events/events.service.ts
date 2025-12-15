import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';

@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(upcoming?: boolean) {
    return this.prisma.event.findMany({
      where: upcoming === undefined ? {} : { isPast: upcoming ? false : undefined },
      orderBy: { date: 'asc' },
    });
  }

  findOne(id: string) {
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
