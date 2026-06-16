"""Read-only inspection of current server state before any changes."""
from _ssh import conn, run

c = conn()
cmds = [
    "pm2 jlist | python3 -c \"import json,sys; d=json.load(sys.stdin); print('\\n'.join(f\\\"{p['name']} pm_id={p['pm_id']} status={p['pm2_env']['status']} restarts={p['pm2_env']['restart_time']}\\\" for p in d))\"",
    "pm2 list",
    "ls -la /var/www/relm-careplus-prod/backend/.env /var/www/relm-careplus-prod/backend/.env.production",
    "grep -c '^CUSTOMER_JWT_SECRET=' /var/www/relm-careplus-prod/backend/.env.production || echo 'CUSTOMER_JWT_SECRET ABSENT'",
    "grep -E '^(JWT_EXPIRES_IN|CORS_ORIGIN|JWT_SECRET|DATABASE_URL)=' /var/www/relm-careplus-prod/backend/.env.production | sed -E 's/(SECRET=|URL=).*/\\1<masked>/'",
    "grep '^JWT_EXPIRES_IN=' /var/www/relm-careplus-prod/backend/.env.production",
    "ls -la /var/www/relm-careplus-prod-web/ | head -20",
    "ls -la /var/www/relm-careplus-prod-web/logo-relm.png",
    "ls -la /var/www/relm-careplus-prod/backend/node_modules/@nestjs/throttler 2>&1 | head -2",
    "ls -la /var/www/relm-careplus-prod/backend/node_modules/helmet 2>&1 | head -2",
    "df -h / | tail -1",
    "curl -s http://127.0.0.1:3005/api/health",
    "curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:3005/docs",
    "which pg_dump psql openssl",
]
for cmd in cmds:
    run(c, cmd)
c.close()
