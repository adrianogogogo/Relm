"""Estado final + limpeza de arquivos temporarios no servidor."""
from _ssh import conn, run
c = conn()
run(c, "pm2 list")
run(c, "curl -s http://127.0.0.1:3005/api/health")
run(c, "grep -c '^CUSTOMER_JWT_SECRET=' /var/www/relm-careplus-prod/backend/.env")
run(c, "rm -f /tmp/admin_login.json /tmp/cust_login.json /tmp/cust_ok.json /tmp/customers.json /tmp/war.json; echo tmp_cleaned")
run(c, "ls -la /root/relm-backups/")
c.close()
