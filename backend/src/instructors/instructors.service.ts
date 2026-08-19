import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import * as bcrypt from 'bcryptjs';
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
  email?: string;
  initialPassword?: string;
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

  // ── Portal do cliente ─────────────────────────────────────────────────────

  /**
   * Lista instrutores sem revelar contato (`phone`/`link`).
   *
   * O cliente recebe o catálogo e, se quiser o desconto, clica em "Gerar
   * credencial" — é essa ação que devolve o WhatsApp e registra o interesse.
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
      },
      orderBy: [{ remote: 'asc' }, { name: 'asc' }],
    });

    return {
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
          // chama markAsUsed nela.
          status: VoucherStatus.UNUSED,
          customerId,
          instructorId,
          expiresAt: this.computeCredentialExpiration(
            customer.currentTier,
            customer.subscription?.expiresAt ?? null,
          ),
        },
      }));

    return {
      voucherId: voucher.id,
      code: voucher.code,
      expiresAt: voucher.expiresAt,
      // Contato liberado agora que a credencial existe.
      phone: instructor.phone,
      link: instructor.link,
      instructorName: instructor.name,
      benefit: instructor.benefit,
      benefitPlus: instructor.benefitPlus,
      tier: customer.currentTier,
    };
  }

  /**
   * Lista as credenciais do cliente com dados do instrutor para a aba "Minhas
   * credenciais".
   */
  async findMyCredentials(customerId: string) {
    const vouchers = await this.prisma.voucher.findMany({
      where: {
        customerId,
        instructorId: { not: null },
        status: VoucherStatus.UNUSED,
      },
      include: {
        instructor: {
          select: {
            id: true,
            name: true,
            phone: true,
            link: true,
            benefit: true,
            benefitPlus: true,
            logoUrl: true,
            active: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return vouchers.map((v) => ({
      id: v.id,
      code: v.code,
      expiresAt: v.expiresAt,
      createdAt: v.createdAt,
      instructor: v.instructor,
    }));
  }

  // ── Painel do instrutor ───────────────────────────────────────────────────

  private async getInstructorForUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { instructorId: true },
    });
    if (!user?.instructorId) {
      throw new ForbiddenException('Usuário não vinculado a um instrutor');
    }
    const instructor = await this.prisma.instructor.findUnique({
      where: { id: user.instructorId },
      include: { specialties: { select: { id: true, name: true } } },
    });
    if (!instructor) {
      throw new NotFoundException('Instrutor vinculado não encontrado');
    }
    return instructor;
  }

  /**
   * Identidade do instrutor logado + data do aceite do termo. Usado pelo front
   * para decidir se mostra a tela normal ou o gate de aceite.
   */
  async me(userId: string) {
    const instructor = await this.getInstructorForUser(userId);
    return {
      id: instructor.id,
      name: instructor.name,
      termsAcceptedAt: instructor.termsAcceptedAt,
      benefit: instructor.benefit,
      benefitPlus: instructor.benefitPlus,
      active: instructor.active,
      specialties: instructor.specialties,
    };
  }

  /**
   * Registra o aceite do termo. Idempotente: se já aceitou, não altera a data.
   */
  async acceptTerms(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { instructorId: true },
    });
    if (!user?.instructorId) {
      throw new ForbiddenException('Usuário não vinculado a um instrutor');
    }
    const instructor = await this.prisma.instructor.findUnique({
      where: { id: user.instructorId },
      select: { id: true, name: true, termsAcceptedAt: true },
    });
    if (!instructor) {
      throw new NotFoundException('Instrutor vinculado não encontrado');
    }
    if (instructor.termsAcceptedAt) return instructor;

    return this.prisma.instructor.update({
      where: { id: instructor.id },
      data: { termsAcceptedAt: new Date() },
      select: { id: true, name: true, termsAcceptedAt: true },
    });
  }

  /**
   * Lista os clientes que geraram credencial para este instrutor. PII mascarada
   * (decisão 11: LGPD sem expor CPF/telefone em lista aberta).
   */
  async listCredentials(userId: string) {
    const instructor = await this.getInstructorForUser(userId);
    if (!instructor.termsAcceptedAt) {
      throw new ForbiddenException('É necessário aceitar o termo antes de consultar credenciais.');
    }

    const vouchers = await this.prisma.voucher.findMany({
      where: {
        instructorId: instructor.id,
        status: VoucherStatus.UNUSED,
      },
      include: {
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

    const now = new Date();
    return {
      instructorName: instructor.name,
      credentials: vouchers.map((v) => {
        const isPlus = tierAtLeast(v.customer.currentTier, TierLevel.PLUS);
        const subExpiresAt = v.customer.subscription?.expiresAt ?? null;
        const plusVigente = isPlus && (!subExpiresAt || subExpiresAt > now);

        return {
          code: v.code,
          customerName: v.customer.fullName,
          customerCpf: maskCpf(v.customer.cpf),
          customerPhone: maskPhone(v.customer.phone),
          tier: v.customer.currentTier,
          // Status calculado agora, não o do momento em que o vínculo nasceu:
          // se o cliente deixou o Plus vencer, o instrutor vê PLUS_VENCIDO.
          status: !isPlus ? 'CARE' : plusVigente ? 'PLUS_ATIVO' : 'PLUS_VENCIDO',
          subscriptionExpiresAt: subExpiresAt,
          credentialExpiresAt: v.expiresAt,
          linkedAt: v.createdAt,
        };
      }),
    };
  }

  /**
   * Consulta pontual de um código apresentado pelo cliente (busca rápida no
   * topo do painel do instrutor).
   */
  async checkCredential(userId: string, code: string) {
    const instructor = await this.getInstructorForUser(userId);
    if (!instructor.termsAcceptedAt) {
      throw new ForbiddenException('É necessário aceitar o termo antes de consultar credenciais.');
    }

    const c = await this.prisma.voucher.findUnique({
      where: { code },
      include: {
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

    if (!c || c.instructorId !== instructor.id) {
      throw new NotFoundException('Credencial não encontrada para este instrutor');
    }

    const isPlus = tierAtLeast(c.customer.currentTier, TierLevel.PLUS);
    const subExpiresAt = c.customer.subscription?.expiresAt ?? null;
    const plusVigente = isPlus && (!subExpiresAt || subExpiresAt > new Date());

    return {
      code: c.code,
      customerName: c.customer.fullName,
      customerCpf: maskCpf(c.customer.cpf),
      customerPhone: maskPhone(c.customer.phone),
      tier: c.customer.currentTier,
      status: !isPlus ? 'CARE' : plusVigente ? 'PLUS_ATIVO' : 'PLUS_VENCIDO',
      subscriptionExpiresAt: subExpiresAt,
      credentialExpiresAt: c.expiresAt,
      linkedAt: c.createdAt,
    };
  }

  /**
   * Permite que o instrutor logado altere sua própria senha.
   */
  async changeMyPassword(userId: string, currentPassword: string, newPassword: string) {
    if (!currentPassword || !newPassword) {
      throw new BadRequestException('Senha atual e nova senha são obrigatórias');
    }
    if (newPassword.length < 6) {
      throw new BadRequestException('A nova senha deve ter no mínimo 6 caracteres');
    }
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) throw new NotFoundException('Usuário não encontrado');

    const match = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!match) {
      throw new BadRequestException('Senha atual incorreta');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    return { message: 'Senha alterada com sucesso' };
  }

  // ── Admin (ADMIN_RELM / GERENTE_RELM) ──────────────────────────────────────

  async findAll() {
    return this.prisma.instructor.findMany({
      include: {
        specialties: { select: { id: true, name: true } },
        users: { select: { id: true, email: true, active: true } },
      },
      orderBy: [{ active: 'desc' }, { name: 'asc' }],
    });
  }

  async findOne(id: string) {
    const instructor = await this.prisma.instructor.findUnique({
      where: { id },
      include: {
        specialties: { select: { id: true, name: true } },
        users: { select: { id: true, email: true, active: true } },
      },
    });
    if (!instructor) throw new NotFoundException('Instrutor não encontrado');
    return instructor;
  }

  async create(dto: CreateInstructorDto) {
    const { specialtyIds, email, initialPassword, ...data } = dto;
    const cleanEmail = email?.trim().toLowerCase();
    const cleanPassword = initialPassword?.trim() || 'Relm@2026';

    if (cleanEmail) {
      const existingUser = await this.prisma.user.findUnique({
        where: { email: cleanEmail },
      });
      if (existingUser) {
        throw new BadRequestException('E-mail de acesso já cadastrado para outro usuário.');
      }
    }

    return this.prisma.$transaction(async (tx) => {
      const instructor = await tx.instructor.create({
        data: {
          ...data,
          ...(specialtyIds?.length
            ? { specialties: { connect: specialtyIds.map((id) => ({ id })) } }
            : {}),
        },
        include: {
          specialties: { select: { id: true, name: true } },
          users: { select: { id: true, email: true, active: true } },
        },
      });

      if (cleanEmail) {
        const passwordHash = await bcrypt.hash(cleanPassword, 10);
        const user = await tx.user.create({
          data: {
            name: dto.name.trim(),
            email: cleanEmail,
            passwordHash,
            role: 'INSTRUTOR',
            instructorId: instructor.id,
            active: true,
          },
          select: { id: true, email: true, active: true },
        });
        instructor.users = [user];
      }

      return instructor;
    });
  }

  async update(id: string, dto: UpdateInstructorDto) {
    await this.findOne(id);
    const { specialtyIds, email, initialPassword, ...data } = dto;
    return this.prisma.instructor.update({
      where: { id },
      data: {
        ...data,
        // `set` e não `connect`: a tela manda a lista final, não um delta.
        ...(specialtyIds
          ? { specialties: { set: specialtyIds.map((sid) => ({ id: sid })) } }
          : {}),
      },
      include: {
        specialties: { select: { id: true, name: true } },
        users: { select: { id: true, email: true, active: true } },
      },
    });
  }

  /**
   * Permite que o administrador redefina a senha do usuário vinculado ao instrutor.
   */
  async resetInstructorPassword(instructorId: string, newPassword?: string) {
    const instructor = await this.prisma.instructor.findUnique({
      where: { id: instructorId },
      include: { users: true },
    });
    if (!instructor) throw new NotFoundException('Instrutor não encontrado');

    const user = instructor.users.find((u) => u.role === 'INSTRUTOR') || instructor.users[0];
    if (!user) {
      throw new NotFoundException('Nenhum usuário de login vinculado encontrado para este instrutor.');
    }

    const cleanPassword = newPassword?.trim() || 'Relm@2026';
    if (cleanPassword.length < 6) {
      throw new BadRequestException('Senha deve ter no mínimo 6 caracteres');
    }

    const passwordHash = await bcrypt.hash(cleanPassword, 10);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    return { message: 'Senha redefinida com sucesso', email: user.email };
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

  // ── Helpers ───────────────────────────────────────────────────────────────

  private generateCredentialCode(): string {
    const bytes = randomBytes(6);
    let out = 'INS-';
    for (let i = 0; i < 6; i++) {
      out += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
    }
    return out;
  }

  private computeCredentialExpiration(
    tier: TierLevel,
    subExpiresAt: Date | null,
  ): Date {
    const isPlus = tierAtLeast(tier, TierLevel.PLUS);
    if (isPlus && subExpiresAt && subExpiresAt > new Date()) {
      return subExpiresAt;
    }
    const d = new Date();
    d.setFullYear(d.getFullYear() + CARE_CREDENTIAL_YEARS);
    return d;
  }
}
