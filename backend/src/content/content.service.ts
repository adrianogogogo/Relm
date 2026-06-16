import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

interface ContentFilters {
  active?: string | boolean;
  targetRole?: string;
}

@Injectable()
export class ContentService {
  constructor(private prisma: PrismaService) {}

  async findAll(filters?: ContentFilters) {
    // Constrói o where explicitamente a partir de campos conhecidos e
    // validados, evitando que query params injetem operadores Prisma
    // aninhados (BUG-08).
    const where: Prisma.ContentItemWhereInput = {};

    if (filters?.active !== undefined) {
      where.active =
        typeof filters.active === 'boolean'
          ? filters.active
          : filters.active === 'true';
    }

    if (typeof filters?.targetRole === 'string' && filters.targetRole) {
      where.targetRole = filters.targetRole;
    }

    return this.prisma.contentItem.findMany({ where });
  }
}
