import paramiko, os, sys

def say(msg):
    sys.stdout.buffer.write((msg + '\n').encode('utf-8', 'replace'))

def _load_env_file(path):
    if not os.path.exists(path): return
    with open(path, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('#') or '=' not in line: continue
            k, v = line.split('=', 1)
            os.environ.setdefault(k.strip(), v.strip())

_load_env_file(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env'))

HOST = '177.153.62.248'; PORT = 22; USER = 'root'
PASS = os.environ.get('RELM_VPS_PASS')
BE = '/var/www/relm-careplus-prod/backend'

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect(HOST, port=PORT, username=USER, password=PASS)

say('1) Executando prisma db push no banco de produção...')
_, o, e = c.exec_command(f'cd {BE} && npx prisma db push')
say(o.read().decode('utf-8', 'replace'))
say(e.read().decode('utf-8', 'replace'))

say('2) Executando seed-services.ts no banco de produção...')
_, o, e = c.exec_command(f'cd {BE} && npx ts-node prisma/seed-services.ts')
say(o.read().decode('utf-8', 'replace'))
say(e.read().decode('utf-8', 'replace'))

c.close()
say('✅ Atualização do banco de dados e seed de produção concluídos com sucesso!')
