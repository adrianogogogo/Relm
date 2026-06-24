import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getWarrantySummary() {
    const summary = await this.prisma.warrantyClaim.groupBy({
      by: ['statusId'],
      _count: true,
    });
    return summary;
  }

  async getDashboardStats() {
    const [
      warrantyCounts,
      totalCustomers,
      totalActiveStores,
      totalActiveEvents,
      totalInsuranceQuotes,
      recentWarranties,
    ] = await Promise.all([
      this.prisma.warrantyClaim.groupBy({ by: ['statusId'], _count: true }),
      this.prisma.customer.count({ where: { active: true } }),
      this.prisma.store.count({ where: { active: true } }),
      this.prisma.event.count({ where: { active: true } }),
      this.prisma.insuranceQuote.count(),
      this.prisma.warrantyClaim.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          protocolNumber: true,
          statusId: true,
          createdAt: true,
          customer: { select: { fullName: true } },
        },
      }),
    ]);

    const warrantyByStatus: Record<string, number> = {};
    warrantyCounts.forEach((item) => {
      warrantyByStatus[item.statusId] = item._count;
    });

    const totalWarranties = Object.values(warrantyByStatus).reduce(
      (acc, val) => acc + val,
      0,
    );

    return {
      warranties: {
        total: totalWarranties,
        byStatus: warrantyByStatus,
        pending:
          (warrantyByStatus['RECEBIDO'] || 0) +
          (warrantyByStatus['EM_ANALISE'] || 0) +
          (warrantyByStatus['AGUARDANDO_CLIENTE'] || 0),
      },
      totalCustomers,
      totalActiveStores,
      totalActiveEvents,
      totalInsuranceQuotes,
      recentWarranties,
    };
  }
}
