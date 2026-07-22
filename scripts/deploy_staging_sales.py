# Deploy para STAGING dos planos 006-009:
#   006/007/008 - registro de venda (sales/sale_items), vigencia de garantia por
#                 numero de serie, PDV da loja, curadoria de produtos e aba de
#                 compras no cliente 360.
#   009        - autenticacao nas rotas de premios/vouchers (RewardsController).
#
# Uso: set RELM_VPS_PASS=... && py -3 scripts/deploy_staging_sales.py
#
# PRE-REQUISITO: rode o build local ANTES (o script sobe o dist do frontend do
# disco local, nao compila remoto):
#   cd frontend && npm run build
#
# Cenario A (historico de migrations ja existe no banco) — ao contrario do
# deploy_staging_club.py, este script NAO faz baseline: apenas migrate deploy.
# Tambem NAO roda `prisma db seed` — nada aqui depende de seed.
import paramiko, os, sys, time

HOST = '177.153.62.248'; PORT = 22; USER = 'root'
PASS = os.environ.get('RELM_VPS_PASS') or sys.exit('defina RELM_VPS_PASS')
ROOT = r'c:\Users\BOSS\Desktop\Relm\Relm-Care'
BE = '/var/www/relm-careplus-staging/backend'
WEB = '/var/www/relm-careplus-staging-web'
PM2_APP = 'relm-careplus-staging-backend'
PORT_APP = 3002
LOCAL_DIST = os.path.join(ROOT, 'frontend', 'dist')
# psql/pg_dump rejeitam o parametro ?schema= do Prisma — removemos o sufixo.
DBURL = 'DB_URL=$(grep DATABASE_URL .env | cut -d= -f2- | tr -d \'"\' | sed \'s/?schema=.*//\')'


def run(c, cmd, t=900):
    _, o, e = c.exec_command(cmd, timeout=t)
    return o.read().decode('utf-8', 'replace'), e.read().decode('utf-8', 'replace')


def say(msg):
    sys.stdout.buffer.write((msg + '\n').encode('utf-8', 'replace'))


def upload_dir(sftp, local, remote):
    try: sftp.stat(remote)
    except FileNotFoundError: sftp.mkdir(remote)
    for it in os.listdir(local):
        if it in ('node_modules', 'dist', '__pycache__'): continue
        lp = os.path.join(local, it); rp = remote + '/' + it
        if os.path.isdir(lp): upload_dir(sftp, lp, rp)
        else: sftp.put(lp, rp)


# 0) Pre-flight local: o dist do frontend precisa existir e ser recente.
if not os.path.isdir(LOCAL_DIST) or not os.path.exists(os.path.join(LOCAL_DIST, 'index.html')):
    sys.exit('ABORTADO: %s nao existe. Rode antes: cd frontend && npm run build' % LOCAL_DIST)
idade_min = (time.time() - os.path.getmtime(os.path.join(LOCAL_DIST, 'index.html'))) / 60
say('0) dist local OK (index.html gerado ha %.0f min)' % idade_min)
if idade_min > 120:
    say('   AVISO: dist tem mais de 2h. Confirme que reflete o codigo atual.')

c = paramiko.SSHClient(); c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect(HOST, port=PORT, username=USER, password=PASS)

ts = time.strftime('%Y%m%d-%H%M%S')
bak = '/root/relm-backups/staging-sales-%s' % ts
run(c, 'mkdir -p %s' % bak)

# 1) BACKUP obrigatorio: banco + dist do backend + .env + web atual.
out, _ = run(c,
    'cd %s && %s && pg_dump "$DB_URL" -Fc -f %s/staging-db.dump && '
    'cp -a dist %s/backend-dist.bak 2>/dev/null; cp -a .env %s/env.bak; '
    'cp -a %s %s/web.bak 2>/dev/null; ls -la %s/staging-db.dump && echo BACKUP_OK'
    % (BE, DBURL, bak, bak, bak, WEB, bak, bak))
say('1) backup -> %s\n%s' % (bak, out.strip()[-300:]))
if 'BACKUP_OK' not in out:
    sys.exit('ABORTADO: backup falhou — nada foi alterado.')

# 2) Upload do backend (src, prisma, scripts, test, package.json).
sftp = c.open_sftp()
upload_dir(sftp, os.path.join(ROOT, 'backend', 'src'), BE + '/src')
upload_dir(sftp, os.path.join(ROOT, 'backend', 'prisma'), BE + '/prisma')
upload_dir(sftp, os.path.join(ROOT, 'backend', 'scripts'), BE + '/scripts')
upload_dir(sftp, os.path.join(ROOT, 'backend', 'test'), BE + '/test')
sftp.put(os.path.join(ROOT, 'backend', 'package.json'), BE + '/package.json')
say('2) upload backend OK')

# 3) Migrations: status antes, depois deploy. A migration nova e
#    20260722000000_add_sales (cria sales e sale_items). E idempotente.
out, err = run(c, 'cd %s && npx prisma migrate status 2>&1 | tail -8' % BE)
say('3) migrate status (antes):\n%s%s' % (out, err[-200:]))
out, err = run(c, 'cd %s && npx prisma migrate deploy 2>&1 | tail -8' % BE)
say('   migrate deploy:\n%s%s' % (out, err[-300:]))
if 'Error' in out or 'error' in err.lower():
    sys.exit('ABORTADO: migrate deploy falhou.\n'
             'Rollback: cd %s && %s && pg_restore --clean --if-exists --no-owner -d "$DB_URL" %s/staging-db.dump'
             % (BE, DBURL, bak))

# 4) generate + build + reload.
out, err = run(c, 'cd %s && npx prisma generate 2>&1 | tail -1 && npm run build 2>&1 | tail -3' % BE)
say('4) generate+build: %s %s' % (out.strip()[-300:], err.strip()[-300:]))
if 'error' in err.lower():
    sys.exit('ABORTADO: build do backend falhou. dist anterior preservado em %s/backend-dist.bak' % bak)
out, err = run(c, 'pm2 reload %s --update-env && pm2 save 2>&1 | tail -1' % PM2_APP)
say('   pm2: %s %s' % (out.strip()[-200:], err.strip()[-150:]))

# 5) Frontend: substitui o dist publicado (backup ja feito no passo 1).
run(c, 'rm -rf %s/*' % WEB)
upload_dir(sftp, LOCAL_DIST, WEB)
run(c, 'chown -R www-data:www-data %s && chmod -R 755 %s' % (WEB, WEB))
out, _ = run(c, "cat %s/index.html | grep -oE 'assets/index-[A-Za-z0-9_-]+\\.js'" % WEB)
say('5) frontend publicado, bundle: %s' % out.strip())

# 6) VERIFICACAO — e aqui que se decide se o deploy prestou.
time.sleep(4)
out, _ = run(c, 'curl -s http://localhost:%d/health | head -c 200' % PORT_APP)
say('6) health: %s' % out.strip())

# 6a) Tabelas novas existem e respondem.
out, _ = run(c,
    'cd %s && %s && for t in sales sale_items; do '
    '  psql "$DB_URL" -tAc "SELECT \'$t: \' || COUNT(*) FROM $t"; done' % (BE, DBURL))
say('   tabelas novas:\n%s' % out.strip())

# 6b) Indices de sale_items (a consulta por numero de serie depende deles).
out, _ = run(c,
    'cd %s && %s && psql "$DB_URL" -tAc '
    '"SELECT indexname FROM pg_indexes WHERE tablename=\'sale_items\' ORDER BY 1"' % (BE, DBURL))
say('   indices de sale_items:\n%s' % out.strip())

# 6c) PROVA do plano 009: rotas de premios/vouchers devem recusar quem nao tem
#     token. Antes do fix isto respondia 200 e vazava dados. Esperado agora: 401.
say('   guards do RewardsController (esperado 401 em ambos):')
for rota in ('v1/rewards/vouchers', 'v1/rewards/vouchers/qualquer-id'):
    out, _ = run(c, 'curl -s -o /dev/null -w "%%{http_code}" http://localhost:%d/api/%s' % (PORT_APP, rota))
    marca = 'OK' if out.strip() == '401' else 'FALHOU — INVESTIGAR'
    say('     /%-32s -> %s  %s' % (rota, out.strip(), marca))
# E o catalogo continua publico de proposito (esperado 200).
out, _ = run(c, 'curl -s -o /dev/null -w "%%{http_code}" http://localhost:%d/api/v1/rewards/catalog' % PORT_APP)
say('     /v1/rewards/catalog (publico)      -> %s  %s'
    % (out.strip(), 'OK' if out.strip() == '200' else 'INVESTIGAR'))

c.close()
say('')
say('=== DEPLOY STAGING CONCLUIDO ===')
say('Backup: %s' % bak)
say('Rollback banco: cd %s && %s && pg_restore --clean --if-exists --no-owner -d "$DB_URL" %s/staging-db.dump' % (BE, DBURL, bak))
say('Rollback web:   rm -rf %s/* && cp -a %s/web.bak/* %s/' % (WEB, bak, WEB))
say('')
say('VALIDAR NA MAO antes de cogitar producao:')
say('  1. Logar como LOJA -> /loja/vendas -> lancar uma venda com serie e prazo 90 dias')
say('  2. Conferir "Em garantia ate <data>" no cliente 360 (aba Compras)')
say('  3. Logar como ADMIN -> /admin/curadoria -> vincular o item ao catalogo')
say('  4. Logar como CLIENTE -> /cliente/resgate -> confirmar que o resgate ainda funciona')
say('     (teste critico do plano 009 — o guard nao pode ter quebrado o portal)')
