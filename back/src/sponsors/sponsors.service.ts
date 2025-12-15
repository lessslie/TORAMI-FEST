import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSponsorDto } from './dto/create-sponsor.dto';
import { UpdateSponsorDto } from './dto/update-sponsor.dto';

@Injectable()
export class SponsorsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(activeOnly?: boolean) {
    const where = activeOnly ? { active: true } : {};

    return this.prisma.sponsor.findMany({
      where,
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const sponsor = await this.prisma.sponsor.findUnique({
      where: { id },
    });

    if (!sponsor) {
      throw new NotFoundException('Sponsor not found');
    }

    return sponsor;
  }

  async create(data: CreateSponsorDto) {
    return this.prisma.sponsor.create({
      data: {
        ...data,
        active: data.active !== undefined ? data.active : true,
      },
    });
  }

  async update(id: string, data: UpdateSponsorDto) {
    await this.findOne(id);

    return this.prisma.sponsor.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    await this.findOne(id);
    return this.prisma.sponsor.delete({ where: { id } });
  }
}
