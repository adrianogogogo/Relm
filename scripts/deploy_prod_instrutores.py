# Deploy do modulo de Instrutores (plano 012) para PRODUCAO.
#
# Uso: RELM_VPS_PASS=... py -3 scripts/deploy_prod_instrutores.py
#
# POR QUE UM SCRIPT PROPRIO: deploy_backend_auth.py sobe apenas backend/src e
# roda `prisma generate` no servidor. Esta onda mexe no SCHEMA — sem subir o
# schema.prisma e sem criar as tabelas, o client gerado sai sem
# `prisma.instructor`, o `nest build` falha e a producao fica com dist quebrado.
# A ordem obrigatoria e: schema -> SQL no banco -> src -> generate -> build.
#
# NAO semeia instrutores ficticios: prisma/seed-instructors.ts e so para local.
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
MIGRATION = '20260817120000_add_instructors_module'


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


# O dist do frontend tem que existir ANTES de mexer no servidor: melhor abortar
# aqui do que no meio, com o backend ja atualizado e o front velho no ar.
local_dist = os.path.join(ROOT, 'frontend', 'dist')
if not os.path.isdir(local_dist):
    sys.exit('frontend/dist nao existe - rode "npm run build" no frontend antes.')

c = paramiko.SSHClient(); c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect(HOST, port=PORT, username=USER, password=PASS)

# Credenciais do banco saem do .env do servidor (mesmo padrao do deploy_prod_club).
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
bak = '/root/relm-backups/prod-instrutores-%s' % ts

# -- 1) BACKUP (obrigatorio) ------------------------------------------------
run(c, 'mkdir -p %s' % bak)
out, err = run(c, 'cd %s && %s pg_dump -Fc -f %s/db.dump && cp -a dist %s/backend-dist.bak && '
                  'cp -a prisma/schema.prisma %s/schema.prisma.bak && ls -la %s' % (
                      BE, pg_env, bak, bak, bak, bak))
say('1) backup em %s:\n%s%s' % (bak, out[-400:], err[-200:]))
if 'db.dump' not in out:
    sys.exit('ABORTADO: backup do banco falhou.')

sftp = c.open_sftp()

# -- 2) Schema + migration ANTES do src -------------------------------------
sftp.put(os.path.join(ROOT, 'backend', 'prisma', 'schema.prisma'), BE + '/prisma/schema.prisma')
try: sftp.stat(BE + '/prisma/migrations/' + MIGRATION)
except FileNotFoundError: sftp.mkdir(BE + '/prisma/migrations/' + MIGRATION)
sftp.put(os.path.join(ROOT, 'backend', 'prisma', 'migrations', MIGRATION, 'migration.sql'),
         BE + '/prisma/migrations/' + MIGRATION + '/migration.sql')
say('2) schema.prisma + migration.sql enviados')

# SQL idempotente via `psql -f`: cada statement em autocommit. `psql -c` embrulha
# tudo numa transacao e o ALTER TYPE ... ADD VALUE nao gosta disso.
out, err = run(c, 'cd %s && %s psql -v ON_ERROR_STOP=1 -f prisma/migrations/%s/migration.sql 2>&1' % (
    BE, pg_env, MIGRATION))
say('3) migration aplicada:\n%s%s' % (out[-700:], err[-300:]))
if 'ERROR' in out.upper() or 'ERROR' in err.upper():
    sys.exit('ABORTADO: migration falhou. Codigo ainda nao foi alterado; backup em %s.' % bak)

# Confere que as tabelas existem antes de subir codigo que depende delas.
out, err = run(c, "%s psql -tAc \"SELECT to_regclass('public.instructors') IS NOT NULL AND "
                  "to_regclass('public.instructor_specialties') IS NOT NULL\"" % pg_env)
if out.strip() != 't':
    sys.exit('ABORTADO: tabelas de instrutores nao existem apos a migration (%s).' % out.strip())
say('4) tabelas confirmadas no banco')

# -- 3) Codigo --------------------------------------------------------------
upload_dir(sftp, os.path.join(ROOT, 'backend', 'src'), BE + '/src')
say('5) backend/src enviado')

out, err = run(c, 'cd %s && NODE_ENV=production npx prisma generate 2>&1 | tail -2 && '
                  'npm run build 2>&1 | tail -6' % BE)
say('6) generate + build:\n%s%s' % (out[-800:], err[-300:]))
if 'error' in (out + err).lower() and 'Generated Prisma Client' not in out:
    sys.exit('ABORTADO: build falhou. dist antigo preservado em %s/backend-dist.bak' % bak)

out, err = run(c, 'pm2 reload %s --update-env && pm2 save 2>&1 | tail -1' % PM2_APP)
say('7) pm2 reload: %s %s' % (out.strip()[-200:], err.strip()[-150:]))

# -- 4) Frontend ------------------------------------------------------------
upload_dir(sftp, local_dist, WEB)
say('8) frontend/dist enviado')

# -- 5) Smoke tests ---------------------------------------------------------
time.sleep(4)
# Os scripts antigos usam 3001 e 3005 em contextos diferentes; sonda as duas em
# vez de chutar. 401/403 na rota nova = ela existe e esta protegida.
rota_ok = False
for porta in ('3001', '3005'):
    for caminho in ('/api/instructors/for-customer', '/instructors/for-customer'):
        out, _ = run(c, 'curl -s -o /dev/null -m 8 -w "%%{http_code}" http://127.0.0.1:%s%s' % (
            porta, caminho))
        codigo = out.strip()
        say('9) %s%s -> HTTP %s' % (porta, caminho, codigo))
        if codigo in ('401', '403'):
            rota_ok = True

out, _ = run(c, 'pm2 describe %s | grep -E "status|restarts" | head -3' % PM2_APP)
say('   pm2: %s' % out.strip().replace('\n', ' | '))

out, _ = run(c, '%s psql -tAc "SELECT (SELECT COUNT(*) FROM instructors)||\' instrutores, \'||'
                '(SELECT COUNT(*) FROM instructor_specialties)||\' especialidades, \'||'
                '(SELECT COUNT(*) FROM users WHERE role=\'INSTRUTOR\')||\' usuarios INSTRUTOR\'"' % pg_env)
say('   producao: %s' % out.strip())

sftp.close(); c.close()
say('\nOK. Backup: %s' % bak)
if not rota_ok:
    sys.exit('ATENCAO: a rota nao respondeu 401/403 - verifique os logs do pm2.')
