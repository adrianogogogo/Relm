import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { NewsletterService } from './newsletter.service';

@ApiTags('newsletter', 'public')
@Controller('public/newsletter')
export class NewsletterController {
  constructor(private newsletterService: NewsletterService) {}

  @Post()
  subscribe(@Body() body: { email: string }) {
    return this.newsletterService.subscribe(body.email);
  }
}
