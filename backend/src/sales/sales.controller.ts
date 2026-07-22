import {
  Controller, Get, Post, Body, Param, Query, UseGuards, Request,
  UseInterceptors, UploadedFile, BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { join, extname } from 'path';
import { randomUUID } from 'crypto';
import { mkdirSync } from 'fs';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { SalesService } from './sales.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { QuerySalesDto } from './dto/query-sales.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

// Upload da nota fiscal da venda para o disco do servidor. Limite 10MB; PDF e
// imagens. Mesmo padrão do upload de anexos de garantia.
// ponytail: disco local — trocar por S3 se o volume crescer.
const salesUpload = {
  storage: diskStorage({
    destination: (_req, _file, cb) => {
      const dir = join(process.cwd(), 'uploads', 'sales');
      mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (_req, file, cb) => cb(null, `${randomUUID()}${extname(file.originalname)}`),
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req: any, file: any, cb: any) => {
    const ok = /^(image\/(jpeg|png|webp|gif)|application\/pdf)$/.test(file.mimetype);
    cb(ok ? null : new BadRequestException('Tipo de arquivo não permitido (PDF ou imagem).'), ok);
  },
};

@ApiTags('sales')
@Controller('sales')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SalesController {
  constructor(private salesService: SalesService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('ADMIN_RELM', 'GERENTE_RELM', 'SUPORTE_RELM', 'LOJA')
  create(@Body() dto: CreateSaleDto, @Request() req: any) {
    return this.salesService.create(dto, req.user?.userId);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles('ADMIN_RELM', 'GERENTE_RELM', 'SUPORTE_RELM', 'LOJA')
  findAll(@Query() query: QuerySalesDto, @Request() req: any) {
    return this.salesService.findAll(query, req.user?.userId);
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN_RELM', 'GERENTE_RELM', 'SUPORTE_RELM', 'LOJA')
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.salesService.findOne(id, req.user?.userId);
  }

  @Post(':id/invoice')
  @UseGuards(RolesGuard)
  @Roles('ADMIN_RELM', 'GERENTE_RELM', 'SUPORTE_RELM', 'LOJA')
  @UseInterceptors(FileInterceptor('file', salesUpload))
  attachInvoice(
    @Param('id') id: string,
    @UploadedFile() file: any,
    @Request() req: any,
  ) {
    if (!file) throw new BadRequestException('Arquivo obrigatório.');
    return this.salesService.attachInvoice(id, file, req.user?.userId);
  }
}
