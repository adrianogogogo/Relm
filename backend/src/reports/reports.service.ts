import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getWarrantySummary() {
    const summary = await this.prisma.warrantyClaim.groupBy({
      by: ['status'],
      _count: true,
    });
    return summary;
  }
}
