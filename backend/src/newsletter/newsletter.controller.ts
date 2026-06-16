import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { NewsletterService } from './newsletter.service';
import { SubscribeNewsletterDto } from './dto/subscribe-newsletter.dto';

@ApiTags('newsletter', 'public')
@Controller('public/newsletter')
export class NewsletterController {
  constructor(private newsletterService: NewsletterService) {}

  @Post()
  subscribe(@Body() body: SubscribeNewsletterDto) {
    return this.newsletterService.subscribe(body.email);
  }
}
