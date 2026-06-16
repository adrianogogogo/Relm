import paramiko
import os
import sys

HOST = '177.153.62.248'
PORT = 22
USER = 'root'
PASS = 'lXde@12#45'

LOCAL_DIST = r'c:\Users\BOSS\Desktop\Relm\Relm-Care\frontend\dist'
REMOTE_WEB = '/var/www/relm-careplus-prod-web'

def upload_dir(sftp, local_dir, remote_dir):
    try:
        sftp.stat(remote_dir)
    except FileNotFoundError:
        sftp.mkdir(remote_dir)
    for item in os.listdir(local_dir):
        local_path = os.path.join(local_dir, item)
        remote_path = remote_dir + '/' + item
        if os.path.isdir(local_path):
            upload_dir(sftp, local_path, remote_path)
        else:
            sftp.put(local_path, remote_path)
            sys.stdout.buffer.write(f'  {remote_path}\n'.encode('utf-8'))
            sys.stdout.flush()

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOST, port=PORT, username=USER, password=PASS)

print('Enviando arquivos para /var/www/relm-careplus-prod-web ...')
sftp = client.open_sftp()
upload_dir(sftp, LOCAL_DIST, REMOTE_WEB)
sftp.close()

print('Deploy concluido!')
client.close()
