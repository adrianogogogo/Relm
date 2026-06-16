"""Etapa 3b - npm ci + prisma generate + migrate status no servidor."""
from _ssh import conn, run

c = conn()
BE = "/var/www/relm-careplus-prod/backend"

# npm ci (installs throttler, helmet, prisma dev) - long running
run(c, f"cd {BE} && npm ci 2>&1 | tail -15", timeout=600)

# verify deps
run(c, f"ls {BE}/node_modules/@nestjs/throttler >/dev/null 2>&1 && echo THROTTLER_OK || echo THROTTLER_MISSING")
run(c, f"ls {BE}/node_modules/helmet >/dev/null 2>&1 && echo HELMET_OK || echo HELMET_MISSING")

# prisma generate
run(c, f"cd {BE} && NODE_ENV=production npx prisma generate 2>&1 | tail -6", timeout=300)

# migrate status (read-only) BEFORE deploy
print("\n===== MIGRATE STATUS (antes do deploy) =====")
run(c, f"cd {BE} && NODE_ENV=production npx prisma migrate status 2>&1", timeout=120)
c.close()
