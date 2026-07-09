# Deploy do clube de assinatura (ondas 1-8) para PRODUCAO.
# Segue backend/prisma/migrations/README-DEPLOY.md (Cenario A: historico existe).
# Uso: RELM_VPS_PASS=... py -3 scripts/deploy_prod_club.py
import paramiko, os, sys, time

HOST = '177.153.62.248'; PORT = 22; USER = 'root'
PASS = os.environ.get('RELM_VPS_PASS') or sys.exit('defina RELM_VPS_PASS')
ROOT = r'c:\Users\BOSS\Desktop\Relm\Relm-Care'
BE = '/var/www/relm-careplus-prod/backend'
WEB = '/var/www/relm-careplus-prod-web'
PM2_APP = 'relm-careplus-prod-backend'
# psql/pg_dump rejeitam o parametro ?schema= do Prisma — removemos o sufixo.
DBURL = 'DB_URL=$(grep DATABASE_URL .env | cut -d= -f2- | tr -d \'"\' | sed \'s/?schema=.*//\')'

def run(c, cmd, t=900):
    _, o, e = c.exec_command(cmd, timeout=t)
    return o.read().decode('utf-8', 'replace'), e.read().decode('utf-8', 'replace')

def say(msg):
    sys.stdout.buffer.write((msg + '\n').encode('utf-8'))

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
bak = '/root/relm-backups/prod-club-%s' % ts
run(c, 'mkdir -p %s' % bak)

# 1) BACKUP (obrigatorio): banco + dist + .env
out, err = run(c,
    'cd %s && %s && pg_dump "$DB_URL" -Fc -f %s/prod-db.dump && '
    'cp -a dist %s/backend-dist.bak 2>/dev/null; cp -a .env %s/env.bak && '
    'ls -la %s/prod-db.dump && echo BACKUP_OK' % (BE, DBURL, bak, bak, bak, bak))
say('1) backup -> %s\n%s %s' % (bak, out.strip(), err.strip()[-300:]))
if 'BACKUP_OK' not in out:
    sys.exit('ABORTADO: backup falhou — nada foi alterado.')

# 2) Upload backend (src, prisma, scripts, test, package.json)
sftp = c.open_sftp()
upload_dir(sftp, os.path.join(ROOT, 'backend', 'src'), BE + '/src')
upload_dir(sftp, os.path.join(ROOT, 'backend', 'prisma'), BE + '/prisma')
upload_dir(sftp, os.path.join(ROOT, 'backend', 'scripts'), BE + '/scripts')
upload_dir(sftp, os.path.join(ROOT, 'backend', 'test'), BE + '/test')
sftp.put(os.path.join(ROOT, 'backend', 'package.json'), BE + '/package.json')
say('2) upload backend OK')

# 3) Status do historico + migrate deploy (Cenario A)
out, err = run(c, 'cd %s && npx prisma migrate status 2>&1 | tail -8' % BE)
say('3) migrate status (antes):\n%s%s' % (out, err[-200:]))
out, err = run(c, 'cd %s && npx prisma migrate deploy 2>&1 | tail -8' % BE)
say('   migrate deploy:\n%s%s' % (out, err[-300:]))
if 'Error' in out or 'Error' in err:
    sys.exit('ABORTADO: migrate deploy falhou. Rollback: pg_restore --clean --if-exists --no-owner -d "$DB_URL" %s/prod-db.dump' % bak)

# 4) Seeds de producao (SQL idempotente — NUNCA prisma db seed em prod)
out, err = run(c,
    'cd %s && %s && psql "$DB_URL" -c "INSERT INTO club_settings (id, key, value, updated_at) VALUES '
    '(gen_random_uuid(), \'plus_annual_fee\', \'299.00\', NOW()), '
    '(gen_random_uuid(), \'point_value_brl\', \'0.05\', NOW()) '
    'ON CONFLICT (key) DO NOTHING" && psql "$DB_URL" -tAc "SELECT key||\'=\'||value FROM club_settings ORDER BY key"' % (BE, DBURL))
say('4) club_settings:\n%s%s' % (out, err[-200:]))

# 5) generate + build + pm2 reload
out, err = run(c, 'cd %s && npx prisma generate 2>&1 | tail -1 && npm run build 2>&1 | tail -3' % BE)
say('5) generate+build: %s %s' % (out.strip()[-400:], err.strip()[-300:]))
if 'error TS' in (out + err) or 'Build failed' in (out + err):
    sys.exit('ABORTADO: build falhou. dist antigo preservado em %s' % bak)
out, err = run(c, 'pm2 reload %s --update-env && pm2 save 2>&1 | tail -1' % PM2_APP)
say('   pm2: %s %s' % (out.strip()[-200:], err.strip()[-150:]))

# 6) Migracao da base -> CARE (dry-run, depois aplica)
out, err = run(c, 'cd %s && npm run migrate:base-to-care -- --dry-run 2>&1 | tail -4' % BE)
say('6) base-to-care dry-run:\n%s%s' % (out, err[-200:]))
out, err = run(c, 'cd %s && npm run migrate:base-to-care 2>&1 | tail -4' % BE)
say('   base-to-care aplicado:\n%s%s' % (out, err[-200:]))

# 7) Frontend: upload do dist buildado localmente
local_dist = os.path.join(ROOT, 'frontend', 'dist')
if not os.path.isdir(local_dist):
    sys.exit('frontend/dist nao existe — rode "npm run build" no frontend antes.')
run(c, 'cp -a %s %s/web.bak 2>/dev/null; mkdir -p %s' % (WEB, bak, WEB))
sftp2 = c.open_sftp()
def upload_all(sftp, local, remote):
    try: sftp.stat(remote)
    except FileNotFoundError: sftp.mkdir(remote)
    for it in os.listdir(local):
        lp = os.path.join(local, it); rp = remote + '/' + it
        if os.path.isdir(lp): upload_all(sftp, lp, rp)
        else: sftp.put(lp, rp)
upload_all(sftp2, local_dist, WEB)
sftp2.close()
say('7) frontend dist publicado em %s (backup em %s/web.bak)' % (WEB, bak))

# 8) Verificacao final
time.sleep(5)
out, _ = run(c, 'curl -s http://localhost:3001/health | head -c 200; echo; curl -s http://localhost:3001/health/crons | head -c 500')
say('8) health:\n%s' % out)
out, _ = run(c,
    'cd %s && %s && for t in payments club_settings insurance_policies referrals achievements customer_achievements partners; do '
    'psql "$DB_URL" -tAc "SELECT \'$t: \'||COUNT(*) FROM $t"; done && '
    'psql "$DB_URL" -tAc "SELECT \'sem_assinatura: \'||COUNT(*) FROM customers c LEFT JOIN subscriptions s ON s.customer_id=c.id WHERE s.id IS NULL"' % (BE, DBURL))
say('   verificacao DB:\n%s' % out)

c.close()
say('=== DEPLOY PRODUCAO CONCLUIDO ===')
say('Rollback DB: pg_restore --clean --if-exists --no-owner -d "$DB_URL" %s/prod-db.dump' % bak)
