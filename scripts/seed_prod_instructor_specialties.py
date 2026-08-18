# Seed das especialidades de instrutores em PRODUCAO (plano 012).
#
# Uso: RELM_VPS_PASS=... py -3 scripts/seed_prod_instructor_specialties.py
#
# Segue a convencao do deploy_prod_club.py: seed de producao e SQL idempotente
# aplicado com psql, NUNCA `prisma db seed` (que roda scripts TS e pode criar
# dados de teste). Este script so INSERE especialidades - nao cria instrutor,
# nao cria usuario, nao apaga nada.
import paramiko, os, sys

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
SQL_LOCAL = os.path.join(ROOT, 'backend', 'prisma', 'seeds', 'instructor-specialties.sql')
SQL_REMOTE = BE + '/prisma/seeds/instructor-specialties.sql'


def run(c, cmd, t=300):
    _, o, e = c.exec_command(cmd, timeout=t)
    return o.read().decode('utf-8', 'replace'), e.read().decode('utf-8', 'replace')


def say(msg):
    sys.stdout.buffer.write((msg + '\n').encode('utf-8'))


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

out, _ = run(c, '%s psql -tAc "SELECT COUNT(*) FROM instructor_specialties"' % pg_env)
say('antes: %s especialidade(s) em producao' % out.strip())

sftp = c.open_sftp()
run(c, 'mkdir -p %s/prisma/seeds' % BE)
sftp.put(SQL_LOCAL, SQL_REMOTE)
sftp.close()

out, err = run(c, '%s psql -v ON_ERROR_STOP=1 -f %s 2>&1' % (pg_env, SQL_REMOTE))
say('psql: %s%s' % (out.strip()[-300:], err.strip()[-200:]))
if 'ERROR' in (out + err).upper():
    sys.exit('ABORTADO: seed falhou. Nada alem do INSERT foi tentado.')

out, _ = run(c, '%s psql -tAc "SELECT name FROM instructor_specialties WHERE active ORDER BY name"' % pg_env)
nomes = [n for n in out.strip().split('\n') if n]
say('\ndepois: %d especialidade(s) ativas em producao:' % len(nomes))
for i, n in enumerate(nomes, 1):
    say('  %2d. %s' % (i, n))

c.close()
