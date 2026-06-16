"""Shared SSH/SFTP helper for the Relm Care+ deploy. Import and use run()/conn()."""
import sys
import paramiko

HOST = '177.153.62.248'
PORT = 22
USER = 'root'
PASS = 'lXde@12#45'

# Force UTF-8 stdout on Windows
try:
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')
except Exception:
    pass


def conn():
    c = paramiko.SSHClient()
    c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    c.connect(HOST, port=PORT, username=USER, password=PASS, timeout=30)
    return c


def run(client, cmd, echo=True, get_pty=False, timeout=600):
    if echo:
        print(f'\n$ {cmd}')
    stdin, stdout, stderr = client.exec_command(cmd, get_pty=get_pty, timeout=timeout)
    out = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    rc = stdout.channel.recv_exit_status()
    if out:
        print(out, end='' if out.endswith('\n') else '\n')
    if err.strip():
        print('STDERR:', err, end='' if err.endswith('\n') else '\n')
    if echo:
        print(f'[exit {rc}]')
    return rc, out, err
