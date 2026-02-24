import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { EventsService } from './events.service';
import { CreateEventDto, UpdateEventDto } from './dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

// ============================================
// CONTROLLER PÚBLICO (Sem autenticação)
// ============================================

@ApiTags('public', 'events')
@Controller('public/events')
export class PublicEventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar eventos públicos' })
  @ApiQuery({ name: 'category', required: false, description: 'Filtrar por categoria' })
  @ApiQuery({ name: 'upcoming', required: false, type: Boolean, description: 'Apenas eventos futuros' })
  findPublicEvents(
    @Query('category') category?: string,
    @Query('upcoming') upcoming?: string,
  ) {
    return this.eventsService.findPublicEvents({
      category,
      upcoming: upcoming === 'true',
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar evento público por ID' })
  findPublicEvent(@Param('id') id: string) {
    return this.eventsService.findPublicEvent(id);
  }

  @Post(':id/register')
  @ApiOperation({ summary: 'Inscrever-se em evento (requer customer ID no body)' })
  register(
    @Param('id') id: string,
    @Body('customerId') customerId: string,
  ) {
    return this.eventsService.register(id, customerId);
  }

  @Delete(':id/unregister')
  @ApiOperation({ summary: 'Cancelar inscrição (requer customer ID no body)' })
  unregister(
    @Param('id') id: string,
    @Body('customerId') customerId: string,
  ) {
    return this.eventsService.unregister(id, customerId);
  }
}

// ============================================
// CONTROLLER ADMIN (Com autenticação)
// ============================================

@ApiTags('events')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  @Roles('ADMIN_RELM', 'LOJA')
  @ApiOperation({ summary: 'Criar novo evento (Admin/Loja)' })
  create(@Body() createEventDto: CreateEventDto, @Request() req) {
    return this.eventsService.create(createEventDto, req.user.sub);
  }

  @Get()
  @Roles('ADMIN_RELM', 'LOJA')
  @ApiOperation({ summary: 'Listar todos os eventos (Admin/Loja)' })
  @ApiQuery({ name: 'isPublic', required: false, type: Boolean })
  @ApiQuery({ name: 'requiresMembership', required: false, type: Boolean })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'storeId', required: false })
  @ApiQuery({ name: 'upcoming', required: false, type: Boolean })
  findAll(
    @Query('isPublic') isPublic?: string,
    @Query('requiresMembership') requiresMembership?: string,
    @Query('category') category?: string,
    @Query('storeId') storeId?: string,
    @Query('upcoming') upcoming?: string,
  ) {
    return this.eventsService.findAll({
      isPublic: isPublic !== undefined ? isPublic === 'true' : undefined,
      requiresMembership: requiresMembership !== undefined ? requiresMembership === 'true' : undefined,
      category,
      storeId,
      upcoming: upcoming === 'true',
    });
  }

  @Get(':id')
  @Roles('ADMIN_RELM', 'LOJA')
  @ApiOperation({ summary: 'Buscar evento por ID com detalhes (Admin/Loja)' })
  findOne(@Param('id') id: string) {
    return this.eventsService.findOne(id);
  }

  @Patch(':id')
  @Roles('ADMIN_RELM', 'LOJA')
  @ApiOperation({ summary: 'Atualizar evento (Admin/Loja)' })
  update(
    @Param('id') id: string,
    @Body() updateEventDto: UpdateEventDto,
    @Request() req,
  ) {
    return this.eventsService.update(id, updateEventDto, req.user.sub, req.user.role);
  }

  @Delete(':id')
  @Roles('ADMIN_RELM', 'LOJA')
  @ApiOperation({ summary: 'Desativar evento (Admin/Loja)' })
  remove(@Param('id') id: string, @Request() req) {
    return this.eventsService.remove(id, req.user.sub, req.user.role);
  }

  @Get('customer/:customerId/registrations')
  @Roles('ADMIN_RELM', 'LOJA')
  @ApiOperation({ summary: 'Listar inscrições de um cliente (Admin/Loja)' })
  getCustomerRegistrations(@Param('customerId') customerId: string) {
    return this.eventsService.getMyRegistrations(customerId);
  }
}
