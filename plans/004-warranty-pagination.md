# Plan 004: Paginate `warranty.findAll` (bound the claims query)

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: from `backend/`, run
> `git diff --stat 65c9418..HEAD -- src/warranty/warranty.service.ts`
> and from `frontend/`, run
> `git diff --stat 65c9418..HEAD -- src/services/api.js`.
> If either changed, compare the "Current state" excerpts below against the live
> code before proceeding; on a mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: MED
- **Depends on**: plans/001-test-baseline.md (Jest pattern; functionally independent)
- **Category**: perf
- **Planned at**: commit `65c9418`, 2026-06-23

## Why this matters

`WarrantyService.findAll` fetches **every** warranty claim in the database on
every admin list load, each with joined customer/product/store records and no
limit. The cost grows linearly with total claims forever. The sibling endpoint
`CustomersService.findAll` was already bounded (commented `M-01` in that file);
warranty was missed, leaving the two list endpoints inconsistent. This plan
applies the same pagination convention to warranty and keeps the frontend
working with a one-line, backwards-compatible change.

## Current state

`src/warranty/warranty.service.ts:208-257` — unbounded query:
```ts
async findAll(filters: any) {
  const where: any = {
    ...(filters.status && { status: filters.status }),
    ...(filters.protocol_number && {
      protocolNumber: { contains: filters.protocol_number },
    }),
  };
  if (filters.search && String(filters.search).trim() !== '') {
    const search = String(filters.search).trim();
    where.OR = [ /* protocol, customer name/email, serial */ ];
  }
  return this.prisma.warrantyClaim.findMany({
    where,
    include: { customer: {...}, product: {...}, store: {...} },
    orderBy: { createdAt: 'desc' },
  });   // ← no skip / take
}
```

The established pagination pattern to mirror — `CustomersService.findAll`
(`src/customers/customers.service.ts:91-159`):
```ts
const MAX_PAGE_SIZE = 200;
const page = Math.max(1, Math.floor(filters?.page ?? 1) || 1);
const pageSize = Math.min(
  MAX_PAGE_SIZE,
  Math.max(1, Math.floor(filters?.pageSize ?? 50) || 50),
);
const skip = (page - 1) * pageSize;
// ...
const [rows, total] = await this.prisma.$transaction([
  this.prisma.customer.findMany({ where, include, orderBy, skip, take: pageSize }),
  this.prisma.customer.count({ where }),
]);
return { data: rows.map(...), total, page, pageSize };
```

The controller already forwards the whole query object
(`src/warranty/warranty.controller.ts:40` — `findAll(@Query() query: any)` →
`warrantyService.findAll(query)`), so `page`/`pageSize` arrive as **strings**
and must be parsed in the service (the `Math.floor(... ?? default)` pattern above
tolerates strings via `Number` coercion only if parsed — see Step 1 for the
exact, string-safe code).

**Frontend consumers of `warrantyAPI.getAll`** (all three currently expect a
bare array):
- `frontend/src/pages/WarrantiesPage.jsx:26`
- `frontend/src/pages/StoreWarrantiesPage.jsx:35`
- `frontend/src/pages/StoreDashboard.jsx:46`

The API helper (`frontend/src/services/api.js:95`):
```js
getAll: (params) => api.get('/warranty/claims', { params }).then((res) => res.data),
```

The frontend already has an established defensive-unwrap idiom for the
paginated envelope — see `frontend/src/pages/CustomersPage.jsx:28`:
`Array.isArray(payload) ? payload : payload?.data ?? []`. This plan applies the
same idea **once**, inside `getAll`, so the three page components keep receiving
an array and need no changes.

## Commands you will need

| Purpose          | Command (cwd)                         | Expected |
|------------------|---------------------------------------|----------|
| Backend tests    | `npm test -- warranty.service` (`backend/`) | pass |
| Backend full     | `npm test` (`backend/`)               | all pass |
| Backend build    | `npm run build` (`backend/`)          | exit 0   |
| Backend lint     | `npm run lint` (`backend/`)           | exit 0   |
| Frontend build   | `npm run build` (`frontend/`)         | exit 0   |

## Scope

**In scope**:
- `backend/src/warranty/warranty.service.ts` — `findAll` only.
- `backend/src/warranty/warranty.service.spec.ts` — extend (created in plan 001).
- `frontend/src/services/api.js` — `warrantyAPI.getAll` one-line unwrap only.

**Out of scope** (do NOT touch):
- The three warranty page components — the `getAll` unwrap keeps them working
  unchanged. Do not add pagination UI in this plan.
- The `storeId` filter gap (the three store consumers pass `{ storeId }` but
  `findAll` does not filter by it). That is a **separate** issue; do not fix it
  here — note it for follow-up (see Maintenance notes). Adding pagination does
  not change that behavior.
- `warranty.controller.ts` — it already forwards the query object; no change.

## Git workflow

- Branch: `advisor/004-warranty-pagination`
- Commit style: Conventional Commits, Portuguese. Suggested:
  `perf(warranty): pagina findAll espelhando customers (M-01)`.
- Do NOT push or open a PR unless instructed.

## Steps

### Step 1: Add pagination to `findAll`

Replace `findAll` (`src/warranty/warranty.service.ts:208-257`) with:

```ts
async findAll(filters: any) {
  const where: any = {
    ...(filters.status && { status: filters.status }),
    ...(filters.protocol_number && {
      protocolNumber: { contains: filters.protocol_number },
    }),
  };

  if (filters.search && String(filters.search).trim() !== '') {
    const search = String(filters.search).trim();
    where.OR = [
      { protocolNumber: { contains: search, mode: 'insensitive' } },
      { customer: { fullName: { contains: search, mode: 'insensitive' } } },
      { customer: { email: { contains: search, mode: 'insensitive' } } },
      { product: { serialNumber: { contains: search, mode: 'insensitive' } } },
    ];
  }

  // Paginação (espelha customers.findAll / M-01). page >= 1,
  // pageSize entre 1 e 200 (default 50). Tolera strings vindas do query.
  const MAX_PAGE_SIZE = 200;
  const page = Math.max(1, Math.floor(Number(filters?.page) || 1));
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, Math.floor(Number(filters?.pageSize) || 50)),
  );
  const skip = (page - 1) * pageSize;

  const [data, total] = await this.prisma.$transaction([
    this.prisma.warrantyClaim.findMany({
      where,
      include: {
        customer: { select: { id: true, fullName: true, email: true, phone: true } },
        product: { select: { id: true, serialNumber: true, model: true, brand: true } },
        store: { select: { id: true, tradeName: true, city: true, state: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
    }),
    this.prisma.warrantyClaim.count({ where }),
  ]);

  return { data, total, page, pageSize };
}
```

**Verify**: `npm run build` (backend) → exit 0; `npm run lint` → exit 0.

### Step 2: Keep the frontend receiving an array

In `frontend/src/services/api.js`, change `warrantyAPI.getAll` (`:95`) to unwrap
the new envelope while still tolerating a bare array (backwards compatible):

```js
getAll: (params) =>
  api.get('/warranty/claims', { params }).then((res) => {
    const payload = res.data;
    return Array.isArray(payload) ? payload : payload?.data ?? [];
  }),
```

Leave every other entry in `warrantyAPI` unchanged.

**Verify**: `npm run build` (frontend) → exit 0.

### Step 3: Extend the warranty spec

Add to `backend/src/warranty/warranty.service.spec.ts` (created in plan 001) a
test that `findAll` returns the envelope, applies the default page size, and
clamps an oversized `pageSize`. Reuse the manual-mock style; `findAll` uses
`prisma.$transaction([...])`, so mock it to resolve with `[rows, total]`.

```ts
describe('WarrantyService.findAll (pagination)', () => {
  function makeService() {
    const prisma: any = {
      $transaction: jest.fn().mockResolvedValue([[{ id: 'w1' }], 1]),
      warrantyClaim: { findMany: jest.fn(), count: jest.fn() },
    };
    const noop: any = {};
    const service = new WarrantyService(prisma, noop, noop, noop, noop, noop);
    return { service, prisma };
  }

  it('returns a paginated envelope with defaults', async () => {
    const { service } = makeService();
    const res: any = await service.findAll({});
    expect(res).toEqual({ data: [{ id: 'w1' }], total: 1, page: 1, pageSize: 50 });
  });

  it('clamps pageSize to the 200 maximum', async () => {
    const { service } = makeService();
    const res: any = await service.findAll({ pageSize: '5000' });
    expect(res.pageSize).toBe(200);
  });
});
```

**Verify**: `npm test -- warranty.service` (backend) → all warranty tests pass
(plan-001 FSM tests + these two).

## Test plan

- `findAll` returns `{ data, total, page, pageSize }` with defaults `page=1`,
  `pageSize=50`.
- `pageSize` over 200 is clamped to 200; string inputs are coerced.
- Frontend `getAll` returns an array for both envelope and legacy-array shapes
  (covered by the defensive unwrap; no automated frontend test required —
  confirm via `npm run build`).

## Done criteria

ALL must hold:

- [ ] `npm test` (backend) exits 0; the two new `findAll` tests pass.
- [ ] `npm run build` and `npm run lint` (backend) exit 0.
- [ ] `npm run build` (frontend) exits 0.
- [ ] `grep -n "take: pageSize" backend/src/warranty/warranty.service.ts` matches.
- [ ] Only the three in-scope files are modified (`git status` in each repo).
- [ ] `plans/README.md` status row for 004 updated.

## STOP conditions

Stop and report back (do not improvise) if:

- `findAll` in the live code no longer matches the "Current state" excerpt.
- A warranty page component reads pagination metadata (`.total`, `.page`)
  directly off `getAll`'s result — then the unwrap-to-array change would hide
  data it needs; report it and propose returning the full envelope plus updating
  that component instead.
- The frontend build fails because a consumer depended on a non-array return.

## Maintenance notes

- For the reviewer: the behavior change is that an admin list now returns at most
  200 claims per request (default 50). There is no pagination UI yet, so confirm
  with the product owner that 50/200 is acceptable as an interim cap, or wire a
  page selector in a follow-up.
- Deferred follow-up #1: add pagination controls to `WarrantiesPage.jsx` and have
  `getAll` expose `{ data, total, page, pageSize }` to it (the backend already
  returns them).
- Deferred follow-up #2 (separate finding): `findAll` ignores the `storeId`
  filter that `StoreWarrantiesPage`/`StoreDashboard` pass — verify whether store
  users are meant to reach this endpoint at all (the controller restricts it to
  `ADMIN_RELM`/`GERENTE_RELM`/`SUPORTE_RELM`), and either add `storeId` filtering
  or point those pages at the correct endpoint.
