"""Etapa 1 - Backups completos no servidor. Verifica tamanho > 0 antes de prosseguir."""
from _ssh import conn, run

c = conn()

# Create timestamp and persist for later steps
rc, ts, _ = run(c, "date +%Y%m%d-%H%M%S", echo=False)
ts = ts.strip()
print(f"TIMESTAMP = {ts}")

BE = "/var/www/relm-careplus-prod/backend"
WEB = "/var/www/relm-careplus-prod-web"
BK = f"/root/relm-backups/{ts}"

run(c, f"mkdir -p {BK} && echo created")

# 3.1 env backups
run(c, f"cp -a {BE}/.env {BK}/env.bak && cp -a {BE}/.env.production {BK}/env.production.bak && echo env_done")

# 3.2 DB dump - extract raw password from DATABASE_URL (handles non-encoded '@')
# DATABASE_URL=postgresql://relm_user:PASS@localhost:5432/db?schema=public
# Password is between 'relm_user:' and the '@localhost'
extract = (
    "python3 - <<'PY'\n"
    "import re\n"
    f"line=[l for l in open('{BE}/.env') if l.startswith('DATABASE_URL=')][0].strip()\n"
    "val=line.split('=',1)[1].strip().strip('\"')\n"
    "# strip scheme\n"
    "rest=val.split('://',1)[1]\n"
    "userinfo, hostpart = rest.split('@localhost',1)\n"
    "user, pwd = userinfo.split(':',1)\n"
    "open('/root/.pgpass_tmp','w').write(pwd)\n"
    "print('USER='+user)\n"
    "print('PWLEN='+str(len(pwd)))\n"
    "PY"
)
run(c, extract)

# Run pg_dump using extracted password
dump_cmd = (
    f"export PGPASSWORD=\"$(cat /root/.pgpass_tmp)\"; "
    f"pg_dump -h localhost -p 5432 -U relm_user -d relm_careplus_prod -Fc "
    f"-f {BK}/relm_careplus_prod.dump 2>&1; echo \"dump_rc=$?\""
)
run(c, dump_cmd)

# 3.3 web + dist backups
run(c, f"cp -a {WEB} /var/www/relm-careplus-prod-web.backup-{ts} && echo web_done")
run(c, f"cp -a {BE}/dist {BK}/backend-dist.bak && echo dist_done")

# 3.4 pm2 + nginx
run(c, f"pm2 jlist > {BK}/pm2-jlist.json && echo pm2_done")
run(c, f"cp -a /etc/nginx/sites-available/relm-careplus {BK}/nginx-relm.bak && echo nginx_done")

# Lock down permissions
run(c, f"chmod 600 {BK}/env.bak {BK}/env.production.bak && echo perms_done")

# Verify sizes > 0
print("\n===== VERIFICACAO DE BACKUPS =====")
run(c, f"ls -la {BK}/")
run(c, f"ls -la /var/www/relm-careplus-prod-web.backup-{ts}/ | head -6")
# Verify dump TOC readable
run(c, f"export PGPASSWORD=\"$(cat /root/.pgpass_tmp)\"; pg_restore -l {BK}/relm_careplus_prod.dump 2>&1 | head -8")

# Assert each critical backup > 0
assert_cmd = (
    f"for f in {BK}/env.bak {BK}/env.production.bak {BK}/relm_careplus_prod.dump {BK}/nginx-relm.bak {BK}/pm2-jlist.json; do "
    f"if [ -s \"$f\" ]; then echo \"OK   $f $(stat -c %s $f) bytes\"; else echo \"FAIL $f EMPTY/MISSING\"; fi; done; "
    f"[ -d {BK}/backend-dist.bak ] && echo \"OK   {BK}/backend-dist.bak (dir)\"; "
    f"[ -d /var/www/relm-careplus-prod-web.backup-{ts} ] && echo \"OK   web.backup-{ts} (dir)\""
)
print("\n===== GATE: tamanhos > 0 =====")
run(c, assert_cmd)

# Clean up temp password file
run(c, "shred -u /root/.pgpass_tmp 2>/dev/null || rm -f /root/.pgpass_tmp; echo cleaned")

# Persist TS to a file locally for next steps
open(r'c:\Users\BOSS\Desktop\Relm\Relm-Care\scripts\.deploy_ts', 'w').write(ts)
print(f"\nTS persisted: {ts}")
c.close()
