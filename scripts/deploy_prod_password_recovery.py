# Deploy do sistema de recuperacao de senha e visualizacao de senha para PRODUCAO.
import paramiko, os, sys, time

def _load_env_file(path):
    if not os.path.exists(path):
        return
    with open(path, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('#') or '=' not in line:
                continue
            k, v = line.split('=', 1)
            os.environ.setdefault(k.strip(), v.strip())

ROOT = r'c:\Users\BOSS\Desktop\Relm\Relm-Care'
_load_env_file(os.path.join(ROOT, '.env'))

HOST = '177.153.62.248'; PORT = 22; USER = 'root'
PASS = os.environ.get('RELM_VPS_PASS') or sys.exit('defina RELM_VPS_PASS')
BE = '/var/www/relm-careplus-prod/backend'
WEB = '/var/www/relm-careplus-prod-web'
PM2_APP = 'relm-careplus-prod-backend'
MIGRATION = '20260819160000_add_user_password_reset_tokens'

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

local_dist = os.path.join(ROOT, 'frontend', 'dist')
if not os.path.isdir(local_dist):
    sys.exit('frontend/dist nao existe - rode "npm run build" no frontend antes.')

c = paramiko.SSHClient(); c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect(HOST, port=PORT, username=USER, password=PASS)

out_env, _ = run(c, 'grep DATABASE_URL %s/.env' % BE)
db_line = out_env.strip().split('=', 1)[1].strip('"\'')
scheme_and_rest = db_line.split('://', 1)[1]
auth_part, host_db_part = scheme_and_rest.rsplit('@', 1)
db_user, db_pass = auth_part.split(':', 1)
host_port, db_and_query = host_db_part.split('/', 1)
db_name = db_and_query.split('?', 1)[0]
db_host = host_port.split(':', 1)[0] if ':' in host_port else host_port
db_port = host_port.split(':', 1)[1] if ':' in host_port else '5432'
pg_env = "PGPASSWORD='%s' PGHOST='%s' PGPORT='%s' PGUSER='%s' PGDATABASE='%s'" % (
    db_pass, db_host, db_port, db_user, db_name)

ts = time.strftime('%Y%m%d-%H%M%S')
bak = '/root/relm-backups/prod-password-recovery-%s' % ts

# 1) BACKUP
run(c, 'mkdir -p %s' % bak)
out, err = run(c, 'cd %s && %s pg_dump -Fc -f %s/db.dump && cp -a dist %s/backend-dist.bak && '
                  'cp -a prisma/schema.prisma %s/schema.prisma.bak && ls -la %s' % (
                      BE, pg_env, bak, bak, bak, bak))
say('1) backup em %s:\n%s%s' % (bak, out[-400:], err[-200:]))
if 'db.dump' not in out:
    sys.exit('ABORTADO: backup do banco falhou.')

sftp = c.open_sftp()

# 2) Schema + migration
sftp.put(os.path.join(ROOT, 'backend', 'prisma', 'schema.prisma'), BE + '/prisma/schema.prisma')
try: sftp.stat(BE + '/prisma/migrations/' + MIGRATION)
except FileNotFoundError: sftp.mkdir(BE + '/prisma/migrations/' + MIGRATION)
sftp.put(os.path.join(ROOT, 'backend', 'prisma', 'migrations', MIGRATION, 'migration.sql'),
         BE + '/prisma/migrations/' + MIGRATION + '/migration.sql')
say('2) schema.prisma + migration.sql enviados')

# Aplica migration no Postgres
out, err = run(c, 'cd %s && %s psql -v ON_ERROR_STOP=1 -f prisma/migrations/%s/migration.sql 2>&1' % (
    BE, pg_env, MIGRATION))
say('3) migration aplicada:\n%s%s' % (out[-700:], err[-300:]))
if 'ERROR' in out.upper() or 'ERROR' in err.upper():
    sys.exit('ABORTADO: migration falhou. Codigo ainda nao foi alterado; backup em %s.' % bak)

# 3) Backend src + build
upload_dir(sftp, os.path.join(ROOT, 'backend', 'src'), BE + '/src')
say('4) backend/src enviado')

out, err = run(c, 'cd %s && NODE_ENV=production npx prisma generate 2>&1 | tail -2 && '
                  'npm run build 2>&1 | tail -6' % BE)
say('5) generate + build:\n%s%s' % (out[-800:], err[-300:]))
if 'error' in (out + err).lower() and 'Generated Prisma Client' not in out:
    sys.exit('ABORTADO: build falhou. dist antigo preservado em %s/backend-dist.bak' % bak)

out, err = run(c, 'pm2 reload %s --update-env && pm2 save 2>&1 | tail -1' % PM2_APP)
say('6) pm2 reload: %s %s' % (out.strip()[-200:], err.strip()[-150:]))

# 4) Frontend dist
upload_dir(sftp, local_dist, WEB)
say('7) frontend/dist enviado')

time.sleep(3)
out, _ = run(c, 'pm2 describe %s | grep -E "status|restarts" | head -3' % PM2_APP)
say('   pm2: %s' % out.strip().replace('\n', ' | '))

sftp.close(); c.close()
say('\nOK. Deploy de Recuperacao de Senha concluido com sucesso! Backup: %s' % bak)
