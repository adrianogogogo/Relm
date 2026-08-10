import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLandingPageDto, UpdateLandingPageDto } from './dto/create-landing-page.dto';

@Injectable()
export class MarketingService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateLandingPageDto) {
    const existing = await this.prisma.landingPage.findUnique({
      where: { slug: dto.slug },
    });
    if (existing) {
      throw new ConflictException(`Landing page com slug '${dto.slug}' já existe.`);
    }

    return this.prisma.landingPage.create({
      data: {
        title: dto.title,
        slug: dto.slug,
        description: dto.description,
        blocksJson: dto.blocksJson,
        storeId: dto.storeId || null,
        active: dto.active !== undefined ? dto.active : true,
      },
      include: { store: true },
    });
  }

  async findAll() {
    return this.prisma.landingPage.findMany({
      orderBy: { createdAt: 'desc' },
      include: { store: true },
    });
  }

  async findBySlugPublic(slug: string) {
    const page = await this.prisma.landingPage.findUnique({
      where: { slug },
      include: { store: true },
    });

    if (!page || !page.active) {
      throw new NotFoundException(`Landing page '${slug}' não encontrada ou inativa.`);
    }

    // Increment viewCount asynchronously
    await this.prisma.landingPage.update({
      where: { id: page.id },
      data: { viewCount: { increment: 1 } },
    });

    return page;
  }

  async findOne(id: string) {
    const page = await this.prisma.landingPage.findUnique({
      where: { id },
      include: { store: true },
    });
    if (!page) {
      throw new NotFoundException(`Landing page ID '${id}' não encontrada.`);
    }
    return page;
  }

  async update(id: string, dto: UpdateLandingPageDto) {
    await this.findOne(id);

    if (dto.slug) {
      const existing = await this.prisma.landingPage.findUnique({
        where: { slug: dto.slug },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException(`Slug '${dto.slug}' já em uso por outra página.`);
      }
    }

    return this.prisma.landingPage.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.slug !== undefined && { slug: dto.slug }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.blocksJson !== undefined && { blocksJson: dto.blocksJson }),
        ...(dto.storeId !== undefined && { storeId: dto.storeId }),
        ...(dto.active !== undefined && { active: dto.active }),
      },
      include: { store: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.landingPage.delete({
      where: { id },
    });
  }
}
