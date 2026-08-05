import { Body, Controller, Get, Patch, Request, UseGuards } from '@nestjs/common';
import { StoresService } from './stores.service';
import { UpdateStoreDto } from './dto/update-store.dto';
import { StoreJwtGuard } from '../store-auth/store-jwt.guard';

// Portal da loja: o lojista logado consulta e edita o cadastro da PRÓPRIA loja.
// O storeId vem do token (StoreJwtGuard), nunca da URL — uma loja não
// consegue acessar nem alterar os dados de outra.
@Controller('store/profile')
@UseGuards(StoreJwtGuard)
export class StoreProfileController {
  constructor(private readonly storesService: StoresService) {}

  @Get()
  getMine(@Request() req: any) {
    return this.storesService.findOne(req.user.storeId);
  }

  @Patch()
  updateMine(@Body() dto: UpdateStoreDto, @Request() req: any) {
    return this.storesService.updateOwnProfile(req.user.storeId, dto);
  }
}
