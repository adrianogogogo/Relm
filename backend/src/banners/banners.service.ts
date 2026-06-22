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

  /**
   * Retorna banners ativos de um público-alvo, combinando:
   *  - os banners da página específica informada, MAIS
   *  - os banners "de todas as páginas" daquele público (page IS NULL).
   * Sem `audience` informado, assume 'PUBLIC' (compatibilidade com a home).
   */
  async findActive(audience?: string, page?: string) {
    const targetAudience = audience || 'PUBLIC';
    const pageFilter = page
      ? { OR: [{ page }, { page: null }] }
      : { page: null };

    return this.prisma.banner.findMany({
      where: {
        active: true,
        audience: targetAudience,
        ...pageFilter,
      },
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
