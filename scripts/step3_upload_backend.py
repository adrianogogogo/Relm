"""Etapa 3a - Upload do codigo-fonte do backend via SFTP (src, prisma, configs).
Exclui node_modules e dist (serao gerados no servidor). Faz upload limpo de src e prisma."""
import os
import stat
import posixpath
from _ssh import conn

LOCAL_BE = r'c:\Users\BOSS\Desktop\Relm\Relm-Care\backend'
REMOTE_BE = '/var/www/relm-careplus-prod/backend'

EXCLUDE_DIRS = {'node_modules', 'dist', '.git'}

def ensure_remote_dir(sftp, path):
    try:
        sftp.stat(path)
    except FileNotFoundError:
        # ensure parent
        parent = posixpath.dirname(path)
        if parent and parent != path:
            ensure_remote_dir(sftp, parent)
        sftp.mkdir(path)

def upload_tree(sftp, local_dir, remote_dir):
    ensure_remote_dir(sftp, remote_dir)
    for item in sorted(os.listdir(local_dir)):
        if item in EXCLUDE_DIRS:
            continue
        lp = os.path.join(local_dir, item)
        rp = remote_dir + '/' + item
        if os.path.isdir(lp):
            upload_tree(sftp, lp, rp)
        else:
            sftp.put(lp, rp)

c = conn()
sftp = c.open_sftp()

# Top-level files to upload
files = ['package.json', 'package-lock.json', 'tsconfig.json', 'tsconfig.build.json', 'nest-cli.json']
print("Uploading top-level backend files...")
for f in files:
    lp = os.path.join(LOCAL_BE, f)
    if os.path.exists(lp):
        sftp.put(lp, REMOTE_BE + '/' + f)
        print(f"  {f}")

# Clean remote src then upload fresh
print("\nCleaning remote src and uploading fresh...")
_in, so, se = c.exec_command(f"rm -rf {REMOTE_BE}/src && echo cleaned")
print("  " + so.read().decode().strip())
upload_tree(sftp, os.path.join(LOCAL_BE, 'src'), REMOTE_BE + '/src')
print("  src uploaded")

# Upload prisma entirely (schema + migrations + seed)
print("\nUploading prisma/ (schema + migrations)...")
upload_tree(sftp, os.path.join(LOCAL_BE, 'prisma'), REMOTE_BE + '/prisma')
print("  prisma uploaded")

# Verify migration dir present remotely
stdin, stdout, stderr = c.exec_command(f"ls {REMOTE_BE}/prisma/migrations/")
print("\nRemote migrations:")
print(stdout.read().decode())

sftp.close()
c.close()
print("Upload done.")
