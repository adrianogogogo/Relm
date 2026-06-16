"""Etapa 3 (migracao) - prisma migrate deploy + verificacao da coluna."""
from _ssh import conn, run

c = conn()
BE = "/var/www/relm-careplus-prod/backend"

rc, out, err = run(c, f"cd {BE} && NODE_ENV=production npx prisma migrate deploy 2>&1", timeout=180)

print("\n===== VERIFICACAO DA COLUNA =====")
# Health still 200 (old code running)
run(c, "curl -s http://127.0.0.1:3005/api/health")

# Verify column exists - extract pw from .env for psql
verify = f"""
cd {BE}
PW=$(python3 -c "l=[x for x in open('.env') if x.startswith('DATABASE_URL=')][0].strip(); v=l.split('=',1)[1].strip().strip(chr(34)); r=v.split('://',1)[1]; ui=r.split('@localhost',1)[0]; print(ui.split(':',1)[1])")
export PGPASSWORD="$PW"
echo "--- column check ---"
psql -h localhost -U relm_user -d relm_careplus_prod -tAc "SELECT column_name, is_nullable, data_type FROM information_schema.columns WHERE table_name='customers' AND column_name='refresh_token';"
echo "--- migration record ---"
psql -h localhost -U relm_user -d relm_careplus_prod -tAc "SELECT migration_name FROM _prisma_migrations WHERE migration_name='20260615000000_add_customer_refresh_token';"
"""
run(c, verify, timeout=60)
c.close()
