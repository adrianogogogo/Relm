import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ContentService {
  constructor(private prisma: PrismaService) {}

  async findAll(filters?: any) {
    return this.prisma.contentItem.findMany({ where: filters });
  }
}
