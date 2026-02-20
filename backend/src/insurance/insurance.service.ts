import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InsuranceService {
  constructor(private prisma: PrismaService) {}

  async create(data: any) {
    const lastProtocol = await this.prisma.insuranceQuote.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { protocolNumber: true },
    });
    const lastNumber = lastProtocol ? parseInt(lastProtocol.protocolNumber.split('-').pop()) : 0;
    const protocolNumber = `SEG-2024-${String(lastNumber + 1).padStart(5, '0')}`;

    return this.prisma.insuranceQuote.create({
      data: { ...data, protocolNumber },
    });
  }
}
