import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BenefitsService {
  constructor(private prisma: PrismaService) {}

  async findAll(filters?: any) {
    return this.prisma.benefit.findMany({ where: filters });
  }
}
