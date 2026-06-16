import paramiko

HOST = '177.153.62.248'
PORT = 22
USER = 'root'
PASS = 'lXde@12#45'

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOST, port=PORT, username=USER, password=PASS)

cmds = [
    'cat /etc/nginx/sites-enabled/relm-careplus',
    'cat /etc/nginx/sites-available/relm-careplus',
    'ls /var/www/',
    'nginx -t',
]

for cmd in cmds:
    print(f'\n=== {cmd} ===')
    _, stdout, stderr = client.exec_command(cmd)
    out = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    if out: print(out)
    if err: print('STDERR:', err)

client.close()
