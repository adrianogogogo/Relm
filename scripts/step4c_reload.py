"""Etapa 4c - pm2 reload (rolling) + save + verificacao de logs/health."""
from _ssh import conn, run

c = conn()
BE = "/var/www/relm-careplus-prod/backend"

# Ensure env synced (already done in Etapa 2, idempotent)
run(c, f"cd {BE} && cp .env.production .env && echo synced")

# Rolling reload
run(c, "pm2 reload relm-careplus-prod-backend 2>&1", timeout=120)
run(c, "pm2 save 2>&1", timeout=60)

# Give it a moment to settle (sleep remote-side)
run(c, "sleep 5; echo settled")

run(c, "pm2 list")
print("\n===== LOGS (procurar crash / CUSTOMER_JWT_SECRET undefined) =====")
run(c, "pm2 logs relm-careplus-prod-backend --lines 40 --nostream 2>&1")

print("\n===== HEALTH / DOCS =====")
run(c, "curl -s http://127.0.0.1:3005/api/health")
run(c, "curl -s -o /dev/null -w 'docs=%{http_code}\\n' http://127.0.0.1:3005/docs")
c.close()
