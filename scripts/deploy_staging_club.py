# Deploy do clube de assinatura (ondas 1-8) para STAGING.
# Uso: set RELM_VPS_PASS=... && py -3 scripts/deploy_staging_club.py
# Segue o runbook backend/prisma/migrations/README-DEPLOY.md.
import paramiko, os, sys, time

HOST = '177.153.62.248'; PORT = 22; USER = 'root'
PASS = os.environ.get('RELM_VPS_PASS') or sys.exit('defina RELM_VPS_PASS')
ROOT = r'c:\Users\BOSS\Desktop\Relm\Relm-Care'
BE = '/var/www/relm-careplus-staging/backend'
WEB = '/var/www/relm-careplus-staging-web'
PM2_APP = 'relm-careplus-staging-backend'

def run(c, cmd, t=600):
    _, o, e = c.exec_command(cmd, timeout=t)
    return o.read().decode('utf-8', 'replace'), e.read().decode('utf-8', 'replace')

def say(msg):
    sys.stdout.buffer.write((msg + '\n').encode())

def upload_dir(sftp, local, remote):
    try: sftp.stat(remote)
    except FileNotFoundError: sftp.mkdir(remote)
    for it in os.listdir(local):
        if it in ('node_modules', 'dist', '__pycache__'): continue
        lp = os.path.join(local, it); rp = remote + '/' + it
        if os.path.isdir(lp): upload_dir(sftp, lp, rp)
        else: sftp.put(lp, rp)

c = paramiko.SSHClient(); c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect(HOST, port=PORT, username=USER, password=PASS)

ts = time.strftime('%Y%m%d-%H%M%S')
bak = '/root/relm-backups/staging-club-%s' % ts
run(c, 'mkdir -p %s' % bak)

# 1) Backup: banco (via DATABASE_URL do .env) + dist + .env
out, err = run(c,
    'cd %s && DB_URL=$(grep DATABASE_URL .env | cut -d= -f2- | tr -d \'"\') && '
    'pg_dump "$DB_URL" -Fc -f %s/staging-db.dump && '
    'cp -a dist %s/backend-dist.bak 2>/dev/null; cp -a .env %s/env.bak && echo BACKUP_OK' % (BE, bak, bak, bak))
say('1) backup -> %s : %s %s' % (bak, out.strip(), err.strip()[-200:]))
if 'BACKUP_OK' not in out:
    sys.exit('ABORTADO: backup falhou — nao seguimos sem backup.')

# 2) Upload backend: src, prisma (schema+migrations+seed), scripts, package.json
sftp = c.open_sftp()
upload_dir(sftp, os.path.join(ROOT, 'backend', 'src'), BE + '/src')
upload_dir(sftp, os.path.join(ROOT, 'backend', 'prisma'), BE + '/prisma')
upload_dir(sftp, os.path.join(ROOT, 'backend', 'scripts'), BE + '/scripts')
upload_dir(sftp, os.path.join(ROOT, 'backend', 'test'), BE + '/test')
sftp.put(os.path.join(ROOT, 'backend', 'package.json'), BE + '/package.json')
say('2) upload backend concluido')

# 3) Baseline de migrations (idempotente): se _prisma_migrations nao existe,
#    baseline-a o schema pre-ondas; migrations das ondas seguem via deploy.
out, err = run(c,
    'cd %s && DB_URL=$(grep DATABASE_URL .env | cut -d= -f2- | tr -d \'"\') && '
    'HAS=$(psql "$DB_URL" -tAc "SELECT to_regclass(\'_prisma_migrations\') IS NOT NULL") && echo HAS_TABLE=$HAS' % BE)
say('3) historico prisma: %s %s' % (out.strip(), err.strip()[-200:]))
if 'HAS_TABLE=t' not in out:
    # marca todas as migrations pre-onda (anteriores a 20260708000000) como aplicadas
    out, err = run(c,
        'cd %s && for m in $(ls prisma/migrations | grep -v README | sort); do '
        '  case $m in 20260708*) ;; *) npx prisma migrate resolve --applied "$m" 2>&1 | tail -1 ;; esac; done && echo BASELINE_OK' % BE)
    say('   baseline: %s %s' % (out.strip()[-400:], err.strip()[-200:]))

# 4) migrate deploy (aplica apenas as pendentes = ondas) + generate + seed de ClubSettings
out, err = run(c, 'cd %s && npx prisma migrate deploy 2>&1 | tail -6' % BE)
say('4) migrate deploy:\n%s%s' % (out, err[-300:]))
if 'Error' in out or 'Error' in err:
    sys.exit('ABORTADO: migrate deploy falhou. Restaure com: pg_restore -c -d "$DB_URL" %s/staging-db.dump' % bak)
out, err = run(c, 'cd %s && npx prisma generate 2>&1 | tail -1 && npx prisma db seed 2>&1 | tail -2' % BE)
say('   generate+seed: %s %s' % (out.strip()[-300:], err.strip()[-200:]))

# 5) build + pm2 reload
out, err = run(c, 'cd %s && npm run build 2>&1 | tail -3' % BE)
say('5) build: %s %s' % (out.strip()[-300:], err.strip()[-300:]))
out, err = run(c, 'pm2 reload %s --update-env && pm2 save 2>&1 | tail -1' % PM2_APP)
say('   pm2: %s %s' % (out.strip()[-200:], err.strip()[-150:]))

# 6) migracao da base -> CARE (dry-run primeiro; o run real e' manual apos conferencia)
out, err = run(c, 'cd %s && npm run migrate:base-to-care -- --dry-run 2>&1 | tail -5' % BE)
say('6) base-to-care (dry-run):\n%s%s' % (out, err[-200:]))

# 7) verificacao: health + crons + tabelas novas
time.sleep(4)
out, _ = run(c, 'curl -s http://localhost:3002/health | head -c 200; echo; curl -s http://localhost:3002/health/crons | head -c 400')
say('7) health:\n%s' % out)
out, _ = run(c,
    'cd %s && DB_URL=$(grep DATABASE_URL .env | cut -d= -f2- | tr -d \'"\') && '
    'for t in payments club_settings insurance_policies referrals achievements customer_achievements partners; do '
    '  psql "$DB_URL" -tAc "SELECT \'$t: \' || COUNT(*) FROM $t"; done' % BE)
say('   tabelas novas:\n%s' % out)

c.close()
say('=== DEPLOY STAGING CONCLUIDO ===')
say('Backup em %s (rollback: pg_restore -c -d $DB_URL %s/staging-db.dump)' % (bak, bak))
