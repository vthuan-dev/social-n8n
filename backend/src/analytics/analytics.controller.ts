import { Controller, Get, Query } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('overview')
  overview() {
    return this.analyticsService.overview();
  }

  @Get('timeline')
  timeline(@Query('days') days?: string) {
    return this.analyticsService.postsTimeline(days ? parseInt(days, 10) : 14);
  }
}
