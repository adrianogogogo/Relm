"""Etapa 2 - Adiciona CUSTOMER_JWT_SECRET, ajusta JWT_EXPIRES_IN=15m, sincroniza .env."""
from _ssh import conn, run

c = conn()
BE = "/var/www/relm-careplus-prod/backend"

# Snapshot key inventory BEFORE
print("===== ANTES: chaves presentes =====")
run(c, f"grep -oE '^[A-Z_]+=' {BE}/.env.production | sort")

# Generate strong secret and ensure != JWT_SECRET, append only if absent
script = f"""
set -e
cd {BE}
NEW_CUST=$(openssl rand -base64 48)
CUR_JWT=$(grep '^JWT_SECRET=' .env.production | cut -d= -f2-)
if [ "$NEW_CUST" = "$CUR_JWT" ]; then echo "COLLISION with JWT_SECRET - regenerating"; NEW_CUST=$(openssl rand -base64 48); fi
# Only append if not already present
if grep -q '^CUSTOMER_JWT_SECRET=' .env.production; then
  echo "ALREADY PRESENT - skipping append"
else
  printf '\\nCUSTOMER_JWT_SECRET=%s\\n' "$NEW_CUST" >> .env.production
  echo "CUSTOMER_JWT_SECRET appended"
fi
# Adjust JWT_EXPIRES_IN to 15m (edit existing line)
sed -i 's/^JWT_EXPIRES_IN=.*/JWT_EXPIRES_IN="15m"/' .env.production
echo "JWT_EXPIRES_IN set"
# Sync .env from .env.production
cp .env.production .env
echo "synced"
"""
run(c, script)

print("\n===== VERIFICACAO =====")
run(c, f"grep -c '^CUSTOMER_JWT_SECRET=' {BE}/.env; grep -c '^CUSTOMER_JWT_SECRET=' {BE}/.env.production")
run(c, f"grep '^JWT_EXPIRES_IN=' {BE}/.env.production")
run(c, f"grep '^CORS_ORIGIN=' {BE}/.env.production")
# Confirm CUSTOMER_JWT_SECRET != JWT_SECRET (compare without printing secrets)
run(c, f"if [ \"$(grep '^CUSTOMER_JWT_SECRET=' {BE}/.env.production | cut -d= -f2-)\" = \"$(grep '^JWT_SECRET=' {BE}/.env.production | cut -d= -f2-)\" ]; then echo 'SAME!!'; else echo 'DIFFERENT (good)'; fi")
# .env == .env.production
run(c, f"diff -q {BE}/.env {BE}/.env.production && echo IDENTICAL")
# No old keys lost - compare key inventory
print("\n===== DEPOIS: chaves presentes =====")
run(c, f"grep -oE '^[A-Z_]+=' {BE}/.env.production | sort")
# DATABASE_URL still intact (masked)
run(c, f"grep -c '^DATABASE_URL=' {BE}/.env.production")
c.close()
