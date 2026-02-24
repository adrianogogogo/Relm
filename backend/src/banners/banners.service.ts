import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBannerDto } from './dto/create-banner.dto';
import { UpdateBannerDto } from './dto/update-banner.dto';

@Injectable()
export class BannersService {
  constructor(private prisma: PrismaService) {}

  async create(createBannerDto: CreateBannerDto) {
    return this.prisma.banner.create({
      data: createBannerDto,
    });
  }

  async findAll() {
    return this.prisma.banner.findMany({
      orderBy: {
        displayOrder: 'asc',
      },
    });
  }

  async findActive() {
    return this.prisma.banner.findMany({
      where: { active: true },
      orderBy: {
        displayOrder: 'asc',
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.banner.findUnique({
      where: { id },
    });
  }

  async update(id: string, updateBannerDto: UpdateBannerDto) {
    return this.prisma.banner.update({
      where: { id },
      data: updateBannerDto,
    });
  }

  async remove(id: string) {
    return this.prisma.banner.delete({
      where: { id },
    });
  }
}
