import paramiko
import os
import sys

def _load_env_file(path):
    if not os.path.exists(path): return
    with open(path, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('#') or '=' not in line: continue
            k, v = line.split('=', 1)
            os.environ.setdefault(k.strip(), v.strip())

_load_env_file('.env')
PASS = os.environ.get('RELM_VPS_PASS')

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('177.153.62.248', 22, 'root', PASS)

cmd = """cd /var/www/relm-careplus-prod/backend && node -e "
require('dotenv').config();
const jwt = require('jsonwebtoken');
const secret = process.env.JWT_SECRET;
console.log('REAL JWT SECRET EXISTS:', !!secret);
const token = jwt.sign({ sub: '2a474db6-0f9f-4ae2-ba03-aa1af7b26910', email: 'admin@relmbikes.com.br', role: 'ADMIN_RELM' }, secret, { expiresIn: '1h' });
const http = require('http');
const req = http.request({ host: 'localhost', port: 3005, path: '/api/stores', headers: { Authorization: 'Bearer ' + token } }, res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('STATUS:', res.statusCode, 'DATA:', data));
});
req.end();
"
"""
_, o, _ = c.exec_command(cmd)
print("=== GET /api/stores WITH REAL SECRET ===")
sys.stdout.buffer.write(o.read())
print("\n")

c.close()
