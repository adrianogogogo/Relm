"""Etapa 4b - Publica frontend dist no web dir (logo incluso no dist), ajusta perms."""
import os
import posixpath
from _ssh import conn, run

LOCAL_DIST = r'c:\Users\BOSS\Desktop\Relm\Relm-Care\frontend\dist'
WEB = '/var/www/relm-careplus-prod-web'

def ensure_remote_dir(sftp, path):
    try:
        sftp.stat(path)
    except FileNotFoundError:
        parent = posixpath.dirname(path)
        if parent and parent != path:
            ensure_remote_dir(sftp, parent)
        sftp.mkdir(path)

def upload_tree(sftp, local_dir, remote_dir):
    ensure_remote_dir(sftp, remote_dir)
    for item in sorted(os.listdir(local_dir)):
        lp = os.path.join(local_dir, item)
        rp = remote_dir + '/' + item
        if os.path.isdir(lp):
            upload_tree(sftp, lp, rp)
        else:
            sftp.put(lp, rp)
            print(f"  {rp}")

c = conn()

# Confirm local dist has logo (sanity)
assert os.path.exists(os.path.join(LOCAL_DIST, 'logo-relm.png')), "logo missing in local dist!"

# Clear web dir contents (backup already made in Etapa 1)
run(c, f"rm -rf {WEB}/* && echo cleared")

sftp = c.open_sftp()
print("Uploading frontend dist...")
upload_tree(sftp, LOCAL_DIST, WEB)
sftp.close()

# Permissions
run(c, f"chown -R www-data:www-data {WEB} && chmod -R 755 {WEB} && echo perms_ok")

# Verify logo + new asset hash present
run(c, f"ls -la {WEB}/logo-relm.png")
run(c, f"ls {WEB}/assets/")
run(c, f"grep -o 'assets/index-[A-Za-z0-9_]*\\.js' {WEB}/index.html")
c.close()
