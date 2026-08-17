import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { TierLevel, VoucherStatus } from '@prisma/client';
import { tierAtLeast } from '../common/entitlements';
import { maskCpf, maskPhone } from '../common/utils/mask';

// Mesmo alfabeto do rewards.service (sem O/0/I/1): o código é ditado por
// telefone. ponytail: 2 linhas duplicadas em vez de extrair um util
// compartilhado — o plano 012 proíbe tocar em src/rewards/.
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

// O tier CARE não tem vencimento de assinatura (`Subscription.expiresAt` é nulo
// por definição), mas `Voucher.expiresAt` é obrigatório. 12 meses é o default
// aprovado no plano 012.
const CARE_CREDENTIAL_YEARS = 1;

export interface CreateInstructorDto {
  name: string;
  benefit: string;
  phone: string;
  benefitPlus?: string;
  description?: string;
  link?: string;
  logoUrl?: string;
  city?: string;
  state?: string;
  remote?: boolean;
  active?: boolean;
  specialtyIds?: string[];
}

export type UpdateInstructorDto = Partial<CreateInstructorDto>;

export interface InstructorFilters {
  state?: string;
  specialtyId?: string;
  remote?: boolean;
}

@Injectable()
export class InstructorsService {
  constructor(private readonly prisma: PrismaService) {}

  private generateCredentialCode() {
    return (
      'INS-' +
      Array.from(randomBytes(5), (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join('')
    );
  }

  // ── Portal do cliente ──────────────────────────────────────────────────────

  /**
   * Lista instrutores ativos para o cliente. NÃO devolve `phone` nem `link`:
   * o contato só sai em `createCredential`, e é isso que garante que todo
   * contato passe pelo sistema (plano 012, decisão 6). O `select` é explícito
   * de propósito — um `include` faria o contato vazar por descuido.
   */
  async findForCustomer(customerId: string, filters: InstructorFilters = {}) {
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
      select: { currentTier: true, state: true },
    });
    const customerTier: TierLevel = customer?.currentTier ?? TierLevel.CARE;

    const instructors = await this.prisma.instructor.findMany({
      where: {
        active: true,
        ...(filters.state ? { state: filters.state } : {}),
        ...(filters.remote ? { remote: true } : {}),
        ...(filters.specialtyId
          ? { specialties: { some: { id: filters.specialtyId } } }
          : {}),
      },
      select: {
        id: true,
        name: true,
        description: true,
        benefit: true,
        benefitPlus: true,
        logoUrl: true,
        city: true,
        state: true,
        remote: true,
        specialties: { select: { id: true, name: true } },
        // phone e link ficam FORA por decisão de produto — não adicione aqui.
      },
      orderBy: [{ remote: 'asc' }, { name: 'asc' }],
    });

    return {
      // O front destaca a linha do tier do cliente e mostra a outra: o Care VÊ
      // o desconto do Plus, é o argumento de venda da assinatura.
      customerTier,
      isPlus: tierAtLeast(customerTier, TierLevel.PLUS),
      customerState: customer?.state ?? null,
      instructors,
    };
  }

  /**
   * Cria (ou devolve) a credencial de vínculo do cliente com o instrutor.
   * Idempotente: uma credencial ativa por par (cliente, instrutor). Grátis —
   * não toca em pontos. Único ponto da API que devolve o contato.
   */
  async createCredential(customerId: string, instructorId: string) {
    const instructor = await this.prisma.instructor.findUnique({
      where: { id: instructorId },
    });
    if (!instructor || !instructor.active) {
      throw new NotFoundException('Instrutor não encontrado');
    }

    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
      select: { currentTier: true, subscription: { select: { expiresAt: true } } },
    });
    if (!customer) throw new NotFoundException('Cliente não encontrado');

    const existing = await this.prisma.voucher.findFirst({
      where: {
        customerId,
        instructorId,
        status: VoucherStatus.UNUSED,
        expiresAt: { gt: new Date() },
      },
    });

    const voucher =
      existing ??
      (await this.prisma.voucher.create({
        data: {
          code: this.generateCredentialCode(),
          // Nasce UNUSED e permanece: credencial é vínculo, não cupom. Nada
          // neste módulo grava USED — o instrutor consulta o status atual.
          status: VoucherStatus.UNUSED,
          customerId,
          instructorId,
          // Grátis: sem pontos gastos e sem valor congelado.
          pointsSpent: null,
          brlValue: null,
          expiresAt: this.credentialExpiry(
            customer.currentTier,
            customer.subscription?.expiresAt ?? null,
          ),
        },
      }));

    if (!existing) {
      await this.prisma.auditLog.create({
        data: {
          userId: null,
          action: 'CREATE',
          entity: 'vouchers',
          entityId: voucher.id,
          metadata: { code: voucher.code, instructorId, kind: 'CREDENCIAL_INSTRUTOR' },
        },
      });
    }

    return {
      code: voucher.code,
      expiresAt: voucher.expiresAt,
      tier: customer.currentTier,
      benefit: instructor.benefit,
      benefitPlus: instructor.benefitPlus,
      // O contato aparece só aqui.
      contact: { phone: instructor.phone, link: instructor.link },
      instructor: { id: instructor.id, name: instructor.name },
    };
  }

  /** Credenciais do próprio cliente — ele precisa rever o código depois. */
  async findMyCredentials(customerId: string) {
    // Já gerou a credencial: o contato pode aparecer.
    return this.prisma.voucher.findMany({
      where: { customerId, instructorId: { not: null } },
      select: {
        code: true,
        expiresAt: true,
        createdAt: true,
        instructor: {
          select: { id: true, name: true, phone: true, link: true, city: true, state: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Plus vale até o vencimento da assinatura; Care não tem vencimento. */
  private credentialExpiry(tier: TierLevel, subscriptionExpiresAt: Date | null): Date {
    if (tierAtLeast(tier, TierLevel.PLUS) && subscriptionExpiresAt) {
      return subscriptionExpiresAt;
    }
    const expiry = new Date();
    expiry.setFullYear(expiry.getFullYear() + CARE_CREDENTIAL_YEARS);
    return expiry;
  }

  // ── Painel do instrutor ────────────────────────────────────────────────────

  /**
   * O token não carrega `instructorId` (jwt.strategy devolve só userId/email/
   * role) — mesmo caso do `storeId` do LOJA. Busca no banco, nunca de query
   * param: filtro de tenant vindo do cliente é o defeito do plano 010.
   */
  private async resolveInstructor(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { instructorId: true },
    });
    if (!user?.instructorId) {
      throw new BadRequestException('Usuário instrutor sem instrutor vinculado.');
    }
    const instructor = await this.prisma.instructor.findUnique({
      where: { id: user.instructorId },
      select: { id: true, name: true, termsAcceptedAt: true },
    });
    if (!instructor) throw new NotFoundException('Instrutor não encontrado');
    return instructor;
  }

  /** Aceite do termo de responsabilidade no primeiro acesso. */
  async acceptTerms(userId: string) {
    const instructor = await this.resolveInstructor(userId);
    if (instructor.termsAcceptedAt) return instructor;
    return this.prisma.instructor.update({
      where: { id: instructor.id },
      data: { termsAcceptedAt: new Date() },
      select: { id: true, name: true, termsAcceptedAt: true },
    });
  }

  async me(userId: string) {
    return this.resolveInstructor(userId);
  }

  /**
   * Clientes vinculados ao próprio instrutor. Tier e status são calculados
   * AGORA (não no vínculo congelado): é isso que pega o cliente que virou Plus,
   * travou o desconto e cancelou depois.
   */
  async listCredentials(userId: string) {
    const instructor = await this.requireAcceptedTerms(userId);

    const credentials = await this.prisma.voucher.findMany({
      where: { instructorId: instructor.id },
      select: {
        code: true,
        expiresAt: true,
        createdAt: true,
        customer: {
          select: {
            fullName: true,
            cpf: true,
            phone: true,
            currentTier: true,
            subscription: { select: { expiresAt: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      instructorName: instructor.name,
      // A prova de exposição prometida ao instrutor.
      total: credentials.length,
      credentials: credentials.map((c) => this.presentCredential(c)),
    };
  }

  /** Consulta pontual de um código. Escopada ao próprio instrutor. */
  async checkCredential(userId: string, code: string) {
    const instructor = await this.requireAcceptedTerms(userId);

    const voucher = await this.prisma.voucher.findUnique({
      where: { code },
      select: {
        code: true,
        expiresAt: true,
        createdAt: true,
        instructorId: true,
        customer: {
          select: {
            fullName: true,
            cpf: true,
            phone: true,
            currentTier: true,
            subscription: { select: { expiresAt: true } },
          },
        },
      },
    });

    if (!voucher || !voucher.instructorId) {
      throw new NotFoundException('Credencial não encontrada');
    }
    if (voucher.instructorId !== instructor.id) {
      throw new ForbiddenException('Esta credencial não é sua.');
    }

    return this.presentCredential(voucher);
  }

  private async requireAcceptedTerms(userId: string) {
    const instructor = await this.resolveInstructor(userId);
    if (!instructor.termsAcceptedAt) {
      throw new ForbiddenException('TERMO_NAO_ACEITO');
    }
    return instructor;
  }

  /**
   * PII mascarada para o instrutor — terceiro externo, mesma regra do
   * LOJA/DISTRIBUIDOR (plano 002, LGPD). Ele precisa do nome para casar o
   * código com a pessoa na frente dele; não precisa do telefone de ninguém,
   * porque o fluxo é cliente → instrutor.
   */
  private presentCredential(c: {
    code: string;
    expiresAt: Date;
    createdAt: Date;
    customer: {
      fullName: string;
      cpf: string | null;
      phone: string;
      currentTier: TierLevel;
      subscription: { expiresAt: Date | null } | null;
    };
  }) {
    const isPlus = tierAtLeast(c.customer.currentTier, TierLevel.PLUS);
    const subExpiresAt = c.customer.subscription?.expiresAt ?? null;
    const plusVigente = isPlus && (!subExpiresAt || subExpiresAt > new Date());

    return {
      code: c.code,
      customerName: c.customer.fullName,
      customerCpf: maskCpf(c.customer.cpf),
      customerPhone: maskPhone(c.customer.phone),
      tier: c.customer.currentTier,
      // Status calculado agora, não o do momento em que o vínculo nasceu.
      status: !isPlus ? 'CARE' : plusVigente ? 'PLUS_ATIVO' : 'PLUS_VENCIDO',
      subscriptionExpiresAt: subExpiresAt,
      credentialExpiresAt: c.expiresAt,
      linkedAt: c.createdAt,
    };
  }

  // ── Admin (ADMIN_RELM / GERENTE_RELM) ──────────────────────────────────────

  async findAll() {
    return this.prisma.instructor.findMany({
      include: { specialties: { select: { id: true, name: true } } },
      orderBy: [{ active: 'desc' }, { name: 'asc' }],
    });
  }

  async findOne(id: string) {
    const instructor = await this.prisma.instructor.findUnique({
      where: { id },
      include: { specialties: { select: { id: true, name: true } } },
    });
    if (!instructor) throw new NotFoundException('Instrutor não encontrado');
    return instructor;
  }

  async create(dto: CreateInstructorDto) {
    const { specialtyIds, ...data } = dto;
    return this.prisma.instructor.create({
      data: {
        ...data,
        ...(specialtyIds?.length
          ? { specialties: { connect: specialtyIds.map((id) => ({ id })) } }
          : {}),
      },
      include: { specialties: { select: { id: true, name: true } } },
    });
  }

  async update(id: string, dto: UpdateInstructorDto) {
    await this.findOne(id);
    const { specialtyIds, ...data } = dto;
    return this.prisma.instructor.update({
      where: { id },
      data: {
        ...data,
        // `set` e não `connect`: a tela manda a lista final, não um delta.
        ...(specialtyIds
          ? { specialties: { set: specialtyIds.map((sid) => ({ id: sid })) } }
          : {}),
      },
      include: { specialties: { select: { id: true, name: true } } },
    });
  }

  /** Inativa (não apaga) — mesmo padrão de parceiros e serviços. */
  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.instructor.update({ where: { id }, data: { active: false } });
  }

  // ── Especialidades ─────────────────────────────────────────────────────────

  async findSpecialties(onlyActive = false) {
    return this.prisma.instructorSpecialty.findMany({
      where: onlyActive ? { active: true } : {},
      orderBy: { name: 'asc' },
    });
  }

  async createSpecialty(name: string) {
    const clean = name?.trim();
    if (!clean) throw new BadRequestException('Nome da especialidade é obrigatório');
    const existing = await this.prisma.instructorSpecialty.findUnique({
      where: { name: clean },
    });
    if (existing) throw new BadRequestException('Especialidade já cadastrada');
    return this.prisma.instructorSpecialty.create({ data: { name: clean } });
  }

  async updateSpecialty(id: string, dto: { name?: string; active?: boolean }) {
    const existing = await this.prisma.instructorSpecialty.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Especialidade não encontrada');
    return this.prisma.instructorSpecialty.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.active !== undefined ? { active: dto.active } : {}),
      },
    });
  }
}
