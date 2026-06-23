# Plan 003: Fix unified refresh for STORE (and customer) tokens

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: from `backend/`, run
> `git diff --stat 65c9418..HEAD -- src/auth/auth.service.ts`
> If it changed, compare the "Current state" excerpts below against the live
> code before proceeding; on a mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: plans/001-test-baseline.md (Jest pattern; functionally independent)
- **Category**: bug
- **Planned at**: commit `65c9418`, 2026-06-23

## Why this matters

The React frontend's single axios interceptor refreshes **every** session type
through one endpoint — `POST /auth/refresh`
(`frontend/src/services/api.js:36`). But `AuthService.refresh()` only ever looks
in the `User` table. So when a **STORE** user (lojista) or a **CUSTOMER** logs in
via `unified-login` and their 15-minute access token expires, `refresh()`
receives a token whose `sub` is a store/customer id, finds no matching `User`,
and throws — silently logging the user out and bouncing them to the login
screen. Store users are hit hardest: they can **only** authenticate via
`unified-login` and have no other refresh path at all. This is a pure
correctness/UX bug; the fix routes each token type to the right table.

## Current state

`src/auth/auth.service.ts:55-76` — refresh only handles the `User` table:
```ts
async refresh(refreshToken: string) {
  try {
    const payload = this.jwtService.verify(refreshToken, {
      secret: this.config.get('JWT_REFRESH_SECRET'),
    });
    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || user.refreshToken !== refreshToken) {
      throw new UnauthorizedException();
    }
    const newPayload = { sub: user.id, email: user.email, role: user.role };
    return { access_token: this.jwtService.sign(newPayload) };
  } catch {
    throw new UnauthorizedException('Refresh token inválido');
  }
}
```

How the three token types are minted in `unifiedLogin`:
- **User (admin/manager/support/loja-RBAC)** — refresh payload `{sub,email,role,userType}`,
  signed `JWT_REFRESH_SECRET`, **persisted** to `user.refreshToken`
  (`:119-129`). Access token signed with the module default (`JWT_SECRET`).
- **Customer** — refresh payload `{sub,email,type:'CUSTOMER',userType:'CUSTOMER'}`,
  signed `JWT_REFRESH_SECRET`, **persisted** to `customer.refreshToken`
  (`:150-162`). Access token signed with **`CUSTOMER_JWT_SECRET`**
  (`:151`; the customer strategy validates that secret —
  `src/customer-auth/customer-jwt.strategy.ts:12`).
- **Store** — refresh payload `{sub,email,type:'STORE',userType:'STORE',storeId,role}`,
  signed `JWT_REFRESH_SECRET`, but **never persisted** (`:185-218` has no
  `storeUser.update`). Access token signed with the module default
  (`JWT_SECRET`; the store strategy validates `JWT_SECRET` + `type:'STORE'` —
  `src/store-auth/store-jwt.strategy.ts:19,24`).

**Important schema fact:** `StoreUser` has **no `refreshToken` column** (only
`resetPasswordToken` — confirmed in `prisma/schema.prisma`, `model StoreUser`).
`Customer` and `User` both have `refreshToken`. Therefore the store path is
handled **statelessly** (verify the signed refresh token and reissue) — this
matches the store's *current* capability exactly (it already had no
persistence/revocation) and avoids a database migration. Adding a revocable
store refresh column is listed as a deferred follow-up.

The `JwtStrategy` (admin) rejects any token carrying a `type` field
(`src/auth/jwt.strategy.ts:20`), so reissued customer/store access tokens (which
carry `type`) will never be accepted on admin routes — the separation is
preserved.

## Commands you will need

(Run from `backend/`.)

| Purpose   | Command                  | Expected on success |
|-----------|--------------------------|---------------------|
| Tests     | `npm test -- auth.service`| auth specs pass     |
| Full test | `npm test`               | all pass            |
| Build     | `npm run build`          | exit 0              |
| Lint      | `npm run lint`           | exit 0              |

## Scope

**In scope**:
- `backend/src/auth/auth.service.ts` — `refresh()` only.
- `backend/src/auth/auth.service.spec.ts` — extend (created in plan 001).

**Out of scope** (do NOT touch):
- `unifiedLogin` and every other method in `auth.service.ts` — leave untouched.
- `prisma/schema.prisma` — no migration in this plan (store refresh is stateless
  by design; see Current state).
- The React frontend — it already posts to `/auth/refresh` for all types; no
  change needed.
- `customer-auth` / `store-auth` modules — their own endpoints are unrelated.

## Git workflow

- Branch: `advisor/003-unified-refresh-fix`
- Commit style: Conventional Commits, Portuguese. Suggested:
  `fix(auth): refresh unificado resolve tokens de loja e cliente`.
- Do NOT push or open a PR unless instructed.

## Steps

### Step 1: Make `refresh()` resolve by token type

Replace the body of `refresh()` (`src/auth/auth.service.ts:55-76`) with:

```ts
async refresh(refreshToken: string) {
  let payload: any;
  try {
    payload = this.jwtService.verify(refreshToken, {
      secret: this.config.get('JWT_REFRESH_SECRET'),
    });
  } catch {
    throw new UnauthorizedException('Refresh token inválido');
  }

  // CUSTOMER: refresh token é persistido (revogável). Reemite access token
  // assinado com CUSTOMER_JWT_SECRET, como no unified-login.
  if (payload.type === 'CUSTOMER') {
    const customer = await this.prisma.customer.findUnique({
      where: { id: payload.sub },
    });
    if (!customer || !customer.active || customer.refreshToken !== refreshToken) {
      throw new UnauthorizedException('Refresh token inválido');
    }
    const newPayload = {
      sub: customer.id,
      email: customer.email,
      type: 'CUSTOMER',
      userType: 'CUSTOMER',
    };
    return {
      access_token: this.jwtService.sign(newPayload, {
        secret: this.config.get('CUSTOMER_JWT_SECRET'),
      }),
    };
  }

  // STORE: StoreUser não tem coluna refreshToken (ver schema). Validação é
  // stateless — a assinatura já foi verificada acima. Confirmamos que o
  // lojista continua ativo e reemitimos o access token (JWT_SECRET padrão).
  if (payload.type === 'STORE') {
    const storeUser = await this.prisma.storeUser.findUnique({
      where: { id: payload.sub },
      include: { store: true },
    });
    if (!storeUser || !storeUser.isActive || !storeUser.store?.active) {
      throw new UnauthorizedException('Refresh token inválido');
    }
    const newPayload = {
      sub: storeUser.id,
      email: storeUser.email,
      type: 'STORE',
      userType: 'STORE',
      storeId: storeUser.storeId,
      role: storeUser.role,
    };
    return { access_token: this.jwtService.sign(newPayload) };
  }

  // USER (admin/gerente/suporte/loja-RBAC): comportamento original, persistido.
  const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user || !user.active || user.refreshToken !== refreshToken) {
    throw new UnauthorizedException('Refresh token inválido');
  }
  const newPayload = { sub: user.id, email: user.email, role: user.role };
  return { access_token: this.jwtService.sign(newPayload) };
}
```

Notes:
- Keep the existing `UnauthorizedException` / `BadRequestException` imports at the
  top of the file (already present).
- The `user.active` check is added for parity with the customer/store branches
  and matches `login()`'s own active check (`:22`). This is a safe tightening; if
  you prefer a literally minimal diff, the original USER branch without
  `!user.active` is also acceptable — but do not loosen the customer/store checks.

**Verify**: `npm run build` → exit 0; `npm run lint` → exit 0.

### Step 2: Extend the auth spec

Add tests to `backend/src/auth/auth.service.spec.ts` (created in plan 001) for
the three refresh branches. Use the manual-mock style already there.

```ts
describe('AuthService.refresh (unified)', () => {
  function setup(verifyPayload: any) {
    const prisma: any = {
      user: { findUnique: jest.fn() },
      customer: { findUnique: jest.fn() },
      storeUser: { findUnique: jest.fn() },
    };
    const jwtService: any = {
      verify: jest.fn().mockReturnValue(verifyPayload),
      sign: jest.fn().mockReturnValue('new-access-token'),
    };
    const config: any = { get: jest.fn().mockReturnValue('secret') };
    const service = new AuthService(prisma, jwtService, config, {} as any);
    return { service, prisma, jwtService };
  }

  it('reissues a STORE access token statelessly when the lojista is active', async () => {
    const { service, prisma, jwtService } = setup({
      sub: 'su1', email: 's@x.com', type: 'STORE', storeId: 'st1', role: 'STORE_ADMIN',
    });
    prisma.storeUser.findUnique.mockResolvedValue({
      id: 'su1', email: 's@x.com', isActive: true, storeId: 'st1',
      role: 'STORE_ADMIN', store: { active: true },
    });
    const res = await service.refresh('rt');
    expect(res.access_token).toBe('new-access-token');
    // STORE token carries type:'STORE' so it stays out of admin routes.
    expect(jwtService.sign).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'STORE', storeId: 'st1' }),
    );
  });

  it('rejects a CUSTOMER refresh token that does not match the stored one', async () => {
    const { service, prisma } = setup({ sub: 'c1', type: 'CUSTOMER' });
    prisma.customer.findUnique.mockResolvedValue({
      id: 'c1', email: 'c@x.com', active: true, refreshToken: 'DIFFERENT',
    });
    await expect(service.refresh('rt')).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('handles a USER (admin) refresh token as before', async () => {
    const { service, prisma } = setup({ sub: 'u1' }); // no type
    prisma.user.findUnique.mockResolvedValue({
      id: 'u1', email: 'a@x.com', active: true, role: 'ADMIN_RELM', refreshToken: 'rt',
    });
    const res = await service.refresh('rt');
    expect(res.access_token).toBe('new-access-token');
  });
});
```

Make sure `UnauthorizedException` is imported in the spec
(`import { UnauthorizedException } from '@nestjs/common';`).

**Verify**: `npm test -- auth.service` → all tests pass (the plan-001 test plus
these three).

## Test plan

- STORE branch: active lojista → reissues token carrying `type:'STORE'` +
  `storeId` (stateless, no DB token check).
- CUSTOMER branch: mismatched stored `refreshToken` → `UnauthorizedException`.
- USER branch: unchanged happy path still works.
- Model: the manual-mock pattern from `plans/001`'s `auth.service.spec.ts`.

## Done criteria

ALL must hold:

- [ ] `npm test` (from `backend/`) exits 0; the four `AuthService` tests pass
      (1 from plan 001 + 3 here).
- [ ] `npm run build` exits 0; `npm run lint` exits 0.
- [ ] `refresh()` contains branches for `payload.type === 'CUSTOMER'` and
      `payload.type === 'STORE'` (`grep -n "type === 'STORE'"
      backend/src/auth/auth.service.ts`).
- [ ] Only `auth.service.ts` and `auth.service.spec.ts` are modified
      (`git status`).
- [ ] `plans/README.md` status row for 003 updated.

## STOP conditions

Stop and report back (do not improvise) if:

- `refresh()` in the live code no longer matches the "Current state" excerpt.
- `StoreUser` turns out to already have a `refreshToken` column (schema changed)
  — then prefer persisting+validating it (revocable) over the stateless branch;
  report so the approach can be upgraded.
- The customer or store JWT strategy no longer validates the secrets named above
  (`CUSTOMER_JWT_SECRET` for customer, `JWT_SECRET` for store) — reissued tokens
  would be rejected; report the mismatch.

## Maintenance notes

- For the reviewer: the security-critical detail is that each reissued **access**
  token is signed with the secret its strategy validates (customer →
  `CUSTOMER_JWT_SECRET`, store/user → `JWT_SECRET`) and that customer/store
  tokens keep their `type` field so they cannot cross into admin routes.
- Deferred follow-up: add a `refreshToken` column to `StoreUser` (Prisma
  migration) and persist it at `unifiedLogin`, so store sessions become
  revocable on logout — matching User/Customer. Out of scope here because it
  needs a DB migration and a running Postgres; the stateless branch fixes the
  reported logout bug without that cost.
