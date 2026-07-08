import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { GamificationService } from './gamification.service';
import { CustomerJwtGuard } from '../customer-auth/customer-jwt.guard';

class LeaderboardOptInDto {
  optIn: boolean;
  nickname?: string;
}

@ApiTags('gamification')
@Controller('gamification')
@UseGuards(CustomerJwtGuard)
@ApiBearerAuth()
export class GamificationController {
  constructor(private readonly gamificationService: GamificationService) {}

  /** Retorna todos os badges (ganhos e não ganhos) do cliente autenticado. */
  @Get('my-achievements')
  getMyAchievements(@Request() req: any) {
    return this.gamificationService.getMyAchievements(req.user.customerId);
  }

  /**
   * Ranking da comunidade — top 20 por pontos EARN no ano corrente.
   * Só aparecem clientes com leaderboardOptIn=true.
   * O campo isMe indica se a entrada pertence ao viewer.
   */
  @Get('leaderboard')
  getLeaderboard(@Request() req: any) {
    return this.gamificationService.getLeaderboard(req.user.customerId);
  }

  /**
   * O cliente define se quer aparecer no ranking e qual apelido usar.
   * Nickname é sanitizado (sem HTML, máx 30 chars).
   * LGPD: participação é opt-in e pode ser desativada a qualquer momento.
   */
  @Patch('leaderboard-optin')
  updateOptIn(@Request() req: any, @Body() dto: LeaderboardOptInDto) {
    return this.gamificationService.updateLeaderboardOptIn(
      req.user.customerId,
      dto.optIn,
      dto.nickname,
    );
  }
}
