# Plan 001: Establish a backend test baseline (Jest harness + first characterization specs)

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: from `backend/`, run
> `git diff --stat 65c9418..HEAD -- src/warranty/warranty.service.ts src/auth/auth.service.ts`
> If either file changed since this plan was written, compare the "Current
> state" excerpts below against the live code before proceeding; on a mismatch,
> treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: LOW
- **Depends on**: none
- **Category**: tests
- **Planned at**: commit `65c9418`, 2026-06-23

## Why this matters

The backend has `jest` fully configured in `backend/package.json` but **zero
`*.spec.ts` files exist**. There is no automated way to know the system works.
The next three plans (002 LGPD masking, 003 auth refresh fix) change
security-critical code; landing them safely requires a working test harness and
a documented pattern to copy. This plan proves the harness runs and seeds it
with two genuine critical-path characterization tests (warranty FSM + login
rejection). It deliberately stays small — the goal is a *trustworthy green
baseline*, not coverage targets.

## Current state

- `backend/package.json:75-91` — Jest config: `rootDir: "src"`, `testRegex:
  ".*\\.spec\\.ts$"`, `transform` via `ts-jest`. So spec files live **next to
  the source** under `src/` and need no extra setup.
- `backend/package.json:16` — `"test": "jest"`.
- No `*.spec.ts` files exist anywhere in `backend/`.

`WarrantyService` constructor (`src/warranty/warranty.service.ts:27-34`) takes
six injected deps in this order:

```ts
constructor(
  private prisma: PrismaService,
  private customersService: CustomersService,
  private productsService: ProductsService,
  private emailService: EmailService,
  private notificationsService: NotificationsService,
  private auditLogsService: AuditLogsService,
) {}
```

The FSM table and the transition check this plan tests
(`src/warranty/warranty.service.ts:13-21` and `:300-358`):

```ts
const FSM_TRANSITIONS = {
  RECEBIDO: ['EM_ANALISE'],
  EM_ANALISE: ['AGUARDANDO_CLIENTE', 'APROVADO', 'REPROVADO'],
  AGUARDANDO_CLIENTE: ['EM_ANALISE'],
  APROVADO: ['FINALIZADO'],
  REPROVADO: ['FINALIZADO'],
  FINALIZADO: [],
  CANCELADO: [],
};
// updateStatus(id, toStatus, userId, data?) throws BadRequestException when
// toStatus is not in FSM_TRANSITIONS[claim.status]; otherwise updates the
// claim, writes a warrantyEvent, and calls auditLogsService.log (best-effort).
```

`AuthService` constructor (`src/auth/auth.service.ts:11-16`) takes:
`prisma, jwtService, config, emailService`. `unifiedLogin(email, password)`
(`:113-222`) tries the `user`, `customer`, then `storeUser` tables and throws
`UnauthorizedException('Credenciais inválidas')` when none match
(`:221`).

These two services are unit-testable with plain manual mocks (no NestJS
`Test.createTestingModule` needed) because their dependencies are simple objects.

## Commands you will need

(Run from `backend/`.)

| Purpose   | Command            | Expected on success |
|-----------|--------------------|---------------------|
| Tests     | `npm test`         | Jest runs; all suites pass |
| One file  | `npm test -- warranty.service` | that spec passes |
| Build     | `npm run build`    | exit 0 (sanity only — not required by this plan) |

## Scope

**In scope** (create these files):
- `backend/src/warranty/warranty.service.spec.ts` (create)
- `backend/src/auth/auth.service.spec.ts` (create)

**Out of scope** (do NOT modify):
- Any source file under `src/` — this plan adds tests only, it does not change
  behavior.
- `backend/package.json` — Jest is already configured; do not touch it.
- E2E tests / `test/` directory — separate concern.

## Git workflow

- Branch: `advisor/001-test-baseline`
- Commit style matches the repo (Conventional Commits, Portuguese — e.g. from
  `git log`: `feat(audit): registra logs de auditoria...`). Suggested message:
  `test(backend): baseline Jest + specs de FSM de garantia e login`.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Confirm the harness runs (expect "no tests")

From `backend/`, run `npm test`. Jest should start and report it found no tests
(exit code may be non-zero with "No tests found" — that is expected and proves
the toolchain works).

**Verify**: `npm test` → Jest banner appears, message about no tests found. If
Jest itself crashes (cannot find `ts-jest`, config error), STOP.

### Step 2: Write the warranty FSM characterization spec

Create `backend/src/warranty/warranty.service.spec.ts` with exactly this
content:

```ts
import { BadRequestException } from '@nestjs/common';
import { WarrantyService } from './warranty.service';

// Manual mocks — these services have simple shapes, so we avoid the NestJS
// testing module and inject plain objects in constructor order.
function makeService(claimStatus: string) {
  const prisma: any = {
    warrantyClaim: {
      findUnique: jest.fn().mockResolvedValue({
        id: 'claim-1',
        status: claimStatus,
        protocolNumber: 'GRT-2026-TEST',
      }),
      update: jest.fn().mockResolvedValue({ id: 'claim-1', status: 'EM_ANALISE' }),
    },
    warrantyEvent: { create: jest.fn().mockResolvedValue({}) },
  };
  const auditLogsService: any = { log: jest.fn().mockResolvedValue(undefined) };
  const noop: any = {};
  const service = new WarrantyService(
    prisma,
    noop, // customersService
    noop, // productsService
    noop, // emailService
    noop, // notificationsService
    auditLogsService,
  );
  return { service, prisma, auditLogsService };
}

describe('WarrantyService.updateStatus (FSM)', () => {
  it('rejects an invalid transition (RECEBIDO -> APROVADO)', async () => {
    const { service, prisma } = makeService('RECEBIDO');
    await expect(
      service.updateStatus('claim-1', 'APROVADO' as any, 'user-1'),
    ).rejects.toBeInstanceOf(BadRequestException);
    // No write should have happened on a rejected transition.
    expect(prisma.warrantyClaim.update).not.toHaveBeenCalled();
  });

  it('allows a valid transition (RECEBIDO -> EM_ANALISE) and records an event', async () => {
    const { service, prisma, auditLogsService } = makeService('RECEBIDO');
    await service.updateStatus('claim-1', 'EM_ANALISE' as any, 'user-1');
    expect(prisma.warrantyClaim.update).toHaveBeenCalledTimes(1);
    expect(prisma.warrantyEvent.create).toHaveBeenCalledTimes(1);
    expect(auditLogsService.log).toHaveBeenCalledTimes(1);
  });
});
```

**Verify**: `npm test -- warranty.service` → 1 suite, 2 tests, all pass.

### Step 3: Write the auth login-rejection spec

Create `backend/src/auth/auth.service.spec.ts` with exactly this content:

```ts
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

function makeService() {
  const prisma: any = {
    user: { findUnique: jest.fn().mockResolvedValue(null) },
    customer: { findUnique: jest.fn().mockResolvedValue(null) },
    storeUser: { findUnique: jest.fn().mockResolvedValue(null) },
  };
  const jwtService: any = { sign: jest.fn(), verify: jest.fn() };
  const config: any = { get: jest.fn().mockReturnValue('test-secret') };
  const emailService: any = {};
  return { service: new AuthService(prisma, jwtService, config, emailService), prisma };
}

describe('AuthService.unifiedLogin', () => {
  it('rejects credentials that match no table', async () => {
    const { service, prisma } = makeService();
    await expect(
      service.unifiedLogin('ghost@example.com', 'whatever'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(prisma.user.findUnique).toHaveBeenCalled();
    expect(prisma.storeUser.findUnique).toHaveBeenCalled();
  });
});
```

**Verify**: `npm test -- auth.service` → 1 suite, 1 test, passes.

### Step 4: Full suite green

**Verify**: `npm test` → 2 suites, 3 tests, all pass, exit code 0.

## Test plan

This plan *is* the test plan — it creates the first specs:
- `warranty.service.spec.ts`: FSM rejects invalid transition; allows valid one
  and writes event + audit log.
- `auth.service.spec.ts`: unified login rejects non-matching credentials.

Both use plain manual mocks injected in constructor order — this is the
documented pattern for plans 002–004 to copy.

## Done criteria

ALL must hold:

- [ ] `backend/src/warranty/warranty.service.spec.ts` exists and passes.
- [ ] `backend/src/auth/auth.service.spec.ts` exists and passes.
- [ ] `npm test` (from `backend/`) exits 0 with 3 passing tests, 0 failures.
- [ ] No files outside the two new spec files are modified (`git status` shows
      only the two new files + this plan's README row).
- [ ] `plans/README.md` status row for 001 updated to DONE.

## STOP conditions

Stop and report back (do not improvise) if:

- Jest itself fails to start in Step 1 (missing `ts-jest`/config error) — this
  is an environment problem, not a test problem.
- The `WarrantyService` or `AuthService` constructor signature in the live code
  differs from the "Current state" excerpts (deps added/reordered) — the mock
  injection order would be wrong; report the new signature.
- `updateStatus` no longer throws `BadRequestException` on an invalid
  transition (FSM behavior changed) — the codebase drifted; report it.
- A test fails twice after a reasonable fix attempt.

## Maintenance notes

- For the reviewer: confirm the mocks assert on *behavior* (a write did/didn't
  happen), not just that no error was thrown.
- Follow-up deliberately deferred: NestJS `Test.createTestingModule`
  integration tests and controller/guard tests. The manual-mock unit style here
  is the cheapest way to get a green baseline; richer harnesses can come when a
  module needs full DI wiring.
- When plans 002/003 add logic, they should add a spec next to the source using
  this same manual-mock pattern.
