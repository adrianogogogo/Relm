#!/bin/bash

cd /var/www/relm-careplus-prod/backend

echo "=== BACKUP CURRENT CONTROLLER ==="
cp src/insurance/insurance.controller.ts src/insurance/insurance.controller.ts.backup-$(date +%Y%m%d-%H%M%S)

echo ""
echo "=== CREATE NEW INSURANCE CONTROLLER ==="

cat > src/insurance/insurance.controller.ts << 'EOFCONTROLLER'
import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { InsuranceService } from './insurance.service';
import { CreateQuoteDto, CreatePolicyDto, UpdateQuoteDto, UpdatePolicyDto } from './dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Insurance')
@Controller()
export class InsuranceController {
  constructor(private readonly insuranceService: InsuranceService) {}

  // =====================
  // PUBLIC ENDPOINTS (Quotes)
  // =====================

  @Post('public/insurance-quote')
  @ApiOperation({ summary: 'Create insurance quote (public)' })
  async createPublicQuote(@Body() dto: CreateQuoteDto) {
    return this.insuranceService.createQuote(dto);
  }

  // =====================
  // ADMIN ENDPOINTS - QUOTES
  // =====================

  @Get('insurance/quotes')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN_RELM, UserRole.GERENTE_RELM)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all insurance quotes (admin)' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'customerId', required: false })
  async findAllQuotes(
    @Query('status') status?: string,
    @Query('customerId') customerId?: string,
  ) {
    return this.insuranceService.findAllQuotes({ status, customerId });
  }

  @Get('insurance/quotes/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN_RELM, UserRole.GERENTE_RELM)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get quote by ID (admin)' })
  async findQuoteById(@Param('id') id: string) {
    return this.insuranceService.findQuoteById(id);
  }

  @Patch('insurance/quotes/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN_RELM, UserRole.GERENTE_RELM)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update quote (admin)' })
  async updateQuote(@Param('id') id: string, @Body() dto: UpdateQuoteDto) {
    return this.insuranceService.updateQuote(id, dto);
  }

  @Post('insurance/quotes/:id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN_RELM, UserRole.GERENTE_RELM)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Approve quote (admin)' })
  async approveQuote(
    @Param('id') id: string,
    @Body() body: { quoteValue: number; insuranceCompany: string },
  ) {
    return this.insuranceService.approveQuote(id, body.quoteValue, body.insuranceCompany);
  }

  @Post('insurance/quotes/:id/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN_RELM, UserRole.GERENTE_RELM)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reject quote (admin)' })
  async rejectQuote(@Param('id') id: string) {
    return this.insuranceService.rejectQuote(id);
  }

  @Post('insurance/quotes/:id/convert-to-policy')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN_RELM, UserRole.GERENTE_RELM)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Convert quote to policy (admin)' })
  async convertQuoteToPolicy(@Param('id') id: string, @Body() dto: CreatePolicyDto) {
    // Set quoteId from URL param
    dto.quoteId = id;
    return this.insuranceService.createPolicy(dto);
  }

  // =====================
  // ADMIN ENDPOINTS - POLICIES
  // =====================

  @Get('insurance/policies')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN_RELM, UserRole.GERENTE_RELM, UserRole.LOJA)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all insurance policies (admin)' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'customerId', required: false })
  async findAllPolicies(
    @Query('status') status?: string,
    @Query('customerId') customerId?: string,
  ) {
    return this.insuranceService.findAllPolicies({ status, customerId });
  }

  @Get('insurance/policies/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN_RELM, UserRole.GERENTE_RELM, UserRole.LOJA)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get policy by ID (admin)' })
  async findPolicyById(@Param('id') id: string) {
    return this.insuranceService.findPolicyById(id);
  }

  @Post('insurance/policies')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN_RELM, UserRole.GERENTE_RELM)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create insurance policy (admin)' })
  async createPolicy(@Body() dto: CreatePolicyDto) {
    return this.insuranceService.createPolicy(dto);
  }

  @Patch('insurance/policies/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN_RELM, UserRole.GERENTE_RELM)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update policy (admin)' })
  async updatePolicy(@Param('id') id: string, @Body() dto: UpdatePolicyDto) {
    return this.insuranceService.updatePolicy(id, dto);
  }

  @Post('insurance/policies/:id/cancel')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN_RELM, UserRole.GERENTE_RELM)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel policy (admin)' })
  async cancelPolicy(@Param('id') id: string, @Body() body?: { reason?: string }) {
    return this.insuranceService.cancelPolicy(id, body?.reason);
  }

  @Post('insurance/policies/:id/renew')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN_RELM, UserRole.GERENTE_RELM)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Renew policy (admin)' })
  async renewPolicy(@Param('id') id: string, @Body() body: { endDate: string }) {
    return this.insuranceService.renewPolicy(id, body.endDate);
  }
}
EOFCONTROLLER

echo "✅ InsuranceController updated!"
cat src/insurance/insurance.controller.ts | grep -E "@(Get|Post|Patch|Delete)\(" | head -20

