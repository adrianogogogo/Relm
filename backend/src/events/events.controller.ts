import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { EventsService } from './events.service';

@ApiTags('events', 'public')
@Controller('public/events')
export class EventsController {
  constructor(private eventsService: EventsService) {}

  @Get()
  findAll() {
    return this.eventsService.findAll();
  }
}
