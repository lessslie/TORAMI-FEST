import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDonationDto } from './dto/create-donation.dto';

@Injectable()
export class DonationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateDonationDto) {
    const donation = await this.prisma.donation.create({
      data: {
        donorName: dto.donorName,
        donorEmail: dto.donorEmail,
        amount: dto.amount,
        isAnonymous: dto.isAnonymous ?? false,
        message: dto.message,
      },
    });

    // TODO: Send thank you email here
    // await this.sendThankYouEmail(donation);

    return donation;
  }

  async findAll() {
    return this.prisma.donation.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        donorName: true,
        amount: true,
        isAnonymous: true,
        message: true,
        createdAt: true,
        // Don't expose email publicly
      },
    });
  }

  async getTotal() {
    const result = await this.prisma.donation.aggregate({
      _sum: {
        amount: true,
      },
    });
    return result._sum.amount || 0;
  }

  async getStats() {
    const total = await this.getTotal();
    const count = await this.prisma.donation.count();
    const recent = await this.prisma.donation.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        donorName: true,
        amount: true,
        isAnonymous: true,
        message: true,
        createdAt: true,
      },
    });

    return {
      total,
      count,
      recent,
    };
  }
}
