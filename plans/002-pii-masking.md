# Plan 002: Mask CPF/phone for LOJA & DISTRIBUIDOR (LGPD)

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: from `backend/`, run
> `git diff --stat 65c9418..HEAD -- src/customers/customers.service.ts`
> If it changed, compare the "Current state" excerpts below against the live
> code before proceeding; on a mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: plans/001-test-baseline.md (for the Jest pattern; functionally independent)
- **Category**: security
- **Planned at**: commit `65c9418`, 2026-06-23

## Why this matters

`antigravity.md` is the project's declared Source of Truth. Its §9.4
("Mascaramento de Dados") **requires** that `LOJA` and `DISTRIBUIDOR` users see
masked CPF and phone — with the exact formats `123.***.**-01` and
`(11) 9****-4321` — and the root README marks this as ✅ done. **It is not
implemented.** A `LOJA` user listing or viewing customers today receives the
**full raw CPF and phone** in the API response. This is an LGPD exposure and a
direct contradiction of a locked design decision. This plan adds a shared
masking utility and applies it on the only role-scoped customer-PII path that
exists (`CustomersService`).

## Current state

`LOJA` reaches customer data through `CustomersController`
(`src/customers/customers.controller.ts:33` and `:54` include `'LOJA'`). The
service formats every customer through one choke point that spreads the raw
record:

`src/customers/customers.service.ts:405-414`:
```ts
private formatCustomer(customer: any) {
  return {
    ...customer,                       // ← includes raw cpf, phone
    name: customer.fullName,
    hasActiveWarranty: customer.warrantyClaims?.some(
      (w) => w.status === 'APROVADO' || w.status === 'FINALIZADO',
    ),
  };
}
```

Both read paths already know the requester's role:
- `findAll(filters)` — `filters.requesterRole` (`:80-159`)
- `findOne(id, requester)` — `requester.requesterRole` (`:161-237`)

…but neither passes it to `formatCustomer`, and `formatCustomer` does no masking.

**CPF is stored as 11 raw digits** (`antigravity.md:73` — "armazenado como texto
com apenas números"). Phone is stored as entered (digits, possibly with
formatting stripped in some flows).

**Write-corruption hazard (must be handled):** `LOJA` can also *edit* customers
(`customers.controller.ts:63` includes `'LOJA'`). `update()`
(`customers.service.ts:254-299`) does `cpf: cpfNormalized || existingCustomer.cpf`
where `cpfNormalized = updateCustomerDto.cpf?.replace(/\D/g, '')`. If a
masked value like `123.***.**-01` is ever submitted back, it normalizes to
`12301` and **overwrites the real CPF**. The fix below adds a guard so any value
containing `*` is treated as "unchanged" and never written.

The masking formats required by `antigravity.md:144-153`:
- CPF `12345678901` → `123.***.**-01` (first 3 digits, last 2 digits visible)
- Phone `11912345678` → `(11) 9****-4321` (DDD + first digit + last 4 visible)

## Commands you will need

(Run from `backend/`.)

| Purpose   | Command                       | Expected on success |
|-----------|-------------------------------|---------------------|
| Tests     | `npm test -- mask`            | mask spec passes    |
| Full test | `npm test`                    | all pass            |
| Build     | `npm run build`               | exit 0              |
| Lint      | `npm run lint`                | exit 0              |

## Scope

**In scope**:
- `backend/src/common/utils/mask.ts` (create)
- `backend/src/common/utils/mask.spec.ts` (create)
- `backend/src/customers/customers.service.ts` (modify: `formatCustomer`,
  `findAll`, `findOne`, `update`)

**Out of scope** (do NOT touch):
- The React frontend. Masked values are plain strings; existing display code
  renders them unchanged. (A future plan may hide the CPF/phone fields from the
  LOJA *edit form* entirely; for now the `update()` guard prevents corruption.)
- `reports/` — `antigravity.md:1186` mentions masked CPF in distributor reports,
  but `ReportsService` returns only aggregates with no CPF today; nothing to mask.
- Any other service. `WarrantyService.findOne` returns CPF but is restricted to
  Relm staff roles only (`warranty.controller.ts:46`), who are allowed full data.

## Git workflow

- Branch: `advisor/002-pii-masking`
- Commit style: Conventional Commits, Portuguese. Suggested:
  `feat(lgpd): mascara CPF/telefone para LOJA e DISTRIBUIDOR`.
- Do NOT push or open a PR unless instructed.

## Steps

### Step 1: Create the masking utility

Create `backend/src/common/utils/mask.ts`:

```ts
// Utilitários de mascaramento de PII (LGPD) — antigravity.md §9.4.
// CPF é armazenado como 11 dígitos; telefone como dígitos (com ou sem DDD).

const ROLES_THAT_SEE_MASKED = ['LOJA', 'DISTRIBUIDOR'];

export function shouldMaskFor(role?: string | null): boolean {
  return !!role && ROLES_THAT_SEE_MASKED.includes(role);
}

// 12345678901 -> 123.***.**-01  (primeiros 3 e últimos 2 visíveis)
export function maskCpf(cpf?: string | null): string | null {
  if (!cpf) return cpf ?? null;
  const d = cpf.replace(/\D/g, '');
  if (d.length < 5) return '***'; // dado incompleto: não revela nada
  return `${d.slice(0, 3)}.***.**-${d.slice(-2)}`;
}

// 11912345678 -> (11) 9****-4321  (DDD + 1º dígito + últimos 4 visíveis)
export function maskPhone(phone?: string | null): string | null {
  if (!phone) return phone ?? null;
  const d = phone.replace(/\D/g, '');
  if (d.length < 6) return '***';
  const ddd = d.slice(0, 2);
  const first = d.slice(2, 3);
  const last4 = d.slice(-4);
  return `(${ddd}) ${first}****-${last4}`;
}
```

**Verify**: `npm run build` → exit 0 (file compiles).

### Step 2: Spec the utility (pure unit test)

Create `backend/src/common/utils/mask.spec.ts`:

```ts
import { maskCpf, maskPhone, shouldMaskFor } from './mask';

describe('PII masking', () => {
  it('masks CPF to antigravity §9.4 format', () => {
    expect(maskCpf('12345678901')).toBe('123.***.**-01');
    expect(maskCpf('123.456.789-01')).toBe('123.***.**-01'); // tolerates formatting
  });

  it('masks phone to antigravity §9.4 format', () => {
    expect(maskPhone('11912344321')).toBe('(11) 9****-4321');
  });

  it('returns null/empty untouched, never crashes on short input', () => {
    expect(maskCpf(null)).toBeNull();
    expect(maskCpf('')).toBeNull();
    expect(maskPhone(undefined)).toBeUndefined();
    expect(maskCpf('12')).toBe('***');
  });

  it('flags only LOJA and DISTRIBUIDOR for masking', () => {
    expect(shouldMaskFor('LOJA')).toBe(true);
    expect(shouldMaskFor('DISTRIBUIDOR')).toBe(true);
    expect(shouldMaskFor('ADMIN_RELM')).toBe(false);
    expect(shouldMaskFor(undefined)).toBe(false);
  });
});
```

**Verify**: `npm test -- mask` → 1 suite, 4 tests, all pass.

### Step 3: Apply masking in `formatCustomer`

In `src/customers/customers.service.ts`:

1. Add the import at the top (with the other imports):
   ```ts
   import { maskCpf, maskPhone, shouldMaskFor } from '../common/utils/mask';
   ```

2. Change `formatCustomer` to accept an optional requester role and mask when
   appropriate:
   ```ts
   private formatCustomer(customer: any, requesterRole?: string) {
     const mask = shouldMaskFor(requesterRole);
     return {
       ...customer,
       cpf: mask ? maskCpf(customer.cpf) : customer.cpf,
       phone: mask ? maskPhone(customer.phone) : customer.phone,
       name: customer.fullName,
       hasActiveWarranty: customer.warrantyClaims?.some(
         (w) => w.status === 'APROVADO' || w.status === 'FINALIZADO',
       ),
     };
   }
   ```

3. In `findAll` (`:153-158`), pass the role through the map:
   ```ts
   data: customers.map((customer) =>
     this.formatCustomer(customer, filters?.requesterRole),
   ),
   ```

4. In `findOne` (`:236`), pass the role:
   ```ts
   return this.formatCustomer(customer, requester?.requesterRole);
   ```

5. Leave `create()` (`:77`) and `update()` (`:298`) calling
   `this.formatCustomer(customer)` with no role — those are write responses to
   admin/manager/support/loja creators; do NOT mask there (the loja just
   submitted the data). Masking on read is what LGPD §9.4 requires.

**Verify**: `npm run build` → exit 0.

### Step 4: Guard `update()` against masked-value writes

In `update()` (`src/customers/customers.service.ts:254-299`), prevent a masked
CPF/phone from ever being persisted. Replace the CPF normalization + the
`data` block so masked inputs fall back to the existing stored value:

```ts
// Um valor mascarado (contém '*') nunca deve sobrescrever o dado real.
const isMasked = (v?: string) => !!v && v.includes('*');

let cpfNormalized = updateCustomerDto.cpf;
if (isMasked(cpfNormalized)) {
  cpfNormalized = undefined; // ignora máscara reenviada
} else if (cpfNormalized) {
  cpfNormalized = cpfNormalized.replace(/\D/g, '');
}

const phoneClean = isMasked(updateCustomerDto.phone)
  ? undefined
  : updateCustomerDto.phone;

const customer = await this.prisma.customer.update({
  where: { id },
  data: {
    ...updateCustomerDto,
    cpf: cpfNormalized || existingCustomer.cpf,
    phone: phoneClean ?? existingCustomer.phone,
  },
  include: {
    store: { select: { id: true, tradeName: true, city: true, state: true } },
  },
});
```

(The `...updateCustomerDto` spread still applies for non-PII fields; the explicit
`cpf`/`phone` keys after it win because they come later in the object.)

**Verify**: `npm run build` → exit 0.

### Step 5: Add a service-level masking spec

Create or extend `backend/src/customers/customers.service.spec.ts` with a test
that `findOne` masks for `LOJA` and does not mask for `ADMIN_RELM`. Model the
manual-mock style on `plans/001`'s `warranty.service.spec.ts`. `CustomersService`
constructor (`customers.service.ts:15-18`) takes `(prisma, notificationsService)`.

```ts
import { CustomersService } from './customers.service';

function makeService(role: string) {
  const customerRow = {
    id: 'c1', fullName: 'Maria Silva', email: 'm@x.com',
    cpf: '12345678901', phone: '11912344321', storeId: 's1',
    warrantyClaims: [], store: null,
  };
  const prisma: any = {
    customer: { findUnique: jest.fn().mockResolvedValue({ ...customerRow }) },
    user: { findUnique: jest.fn().mockResolvedValue({ storeId: 's1' }) },
  };
  const service = new CustomersService(prisma, {} as any);
  return { service };
}

describe('CustomersService.findOne masking', () => {
  it('masks CPF/phone for LOJA', async () => {
    const { service } = makeService('LOJA');
    const result: any = await service.findOne('c1', {
      requesterUserId: 'u1', requesterRole: 'LOJA',
    });
    expect(result.cpf).toBe('123.***.**-01');
    expect(result.phone).toBe('(11) 9****-4321');
  });

  it('returns raw CPF for ADMIN_RELM', async () => {
    const { service } = makeService('ADMIN_RELM');
    const result: any = await service.findOne('c1', {
      requesterUserId: 'u1', requesterRole: 'ADMIN_RELM',
    });
    expect(result.cpf).toBe('12345678901');
  });
});
```

> Note: `findOne` for `LOJA` also enforces store ownership
> (`customers.service.ts:225-234`); the mock returns matching `storeId: 's1'`
> so the ownership check passes and we reach the masking. If the live ownership
> logic differs, adjust the mock — do not change the service.

**Verify**: `npm test -- customers.service` → all tests pass.

## Test plan

- `mask.spec.ts`: CPF/phone format correctness, null/short-input safety, role gating.
- `customers.service.spec.ts`: `findOne` masks for LOJA, not for ADMIN_RELM.
- Regression covered: write-corruption guard is implicitly protected by the
  `isMasked` logic (optionally add an `update()` test asserting a masked CPF
  leaves the stored value unchanged — recommended but not required).

## Done criteria

ALL must hold:

- [ ] `npm test` (from `backend/`) exits 0; `mask` and `customers.service`
      suites pass.
- [ ] `npm run build` exits 0; `npm run lint` exits 0.
- [ ] `grep -rn "maskCpf\|maskPhone" backend/src/customers/customers.service.ts`
      shows masking wired into `formatCustomer`.
- [ ] A LOJA-role response to `GET /customers` and `GET /customers/:id` returns
      `cpf` in the form `NNN.***.**-NN` (verify via the new spec).
- [ ] No files outside the In-scope list are modified (`git status`).
- [ ] `plans/README.md` status row for 002 updated.

## STOP conditions

Stop and report back (do not improvise) if:

- `formatCustomer`, `findAll`, `findOne`, or `update` in the live code no longer
  match the "Current state" excerpts (drift).
- You discover another endpoint (outside `CustomersService`) that returns raw
  customer CPF/phone to a LOJA or DISTRIBUIDOR token — report it; it needs the
  same treatment but is outside this plan's scope.
- CPF turns out to be stored *encrypted* rather than as plain 11 digits — the
  masking offsets would be wrong; report and stop.

## Maintenance notes

- For the reviewer: confirm masking is applied on **read** paths only and that
  the `update()` guard blocks `*`-bearing values from being written. The riskiest
  regression is silent CPF corruption via the LOJA edit form.
- Follow-up deferred: hide CPF/phone fields entirely from the LOJA edit form in
  the React frontend (defense in depth beyond the backend write-guard), and
  audit-log masked-data access per `antigravity.md:159` ("com auditoria").
- `shouldMaskFor` centralizes the role list — extend it there if a new
  partner role needs masking.
