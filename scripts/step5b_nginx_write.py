"""Etapa 5 - Escreve nova config nginx com 3 headers de seguranca (sem HSTS).
Adiciona no server-level e replica nos locations que ja usam add_header (/ e assets),
porque add_header em location sobrescreve os herdados do server."""
from _ssh import conn, run

NEW_CONF = r"""upstream backend_api {
    server localhost:3005;
}

server {
    listen 80;
    server_name 177.153.62.248;

    root /var/www/relm-careplus-prod-web;
    index index.html;

    # Security headers (site e HTTP/IP -> SEM HSTS)
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Frontend - sem cache para desenvolvimento
    location / {
        try_files $uri $uri/ /index.html;

        # Desabilitar cache para desenvolvimento
        add_header Cache-Control "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0";
        add_header Pragma "no-cache";
        add_header Expires "0";

        # Security headers (replicados: add_header em location sobrescreve os do server)
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    }

    # Assets também sem cache
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        add_header Cache-Control "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0";
        add_header Pragma "no-cache";
        add_header Expires "0";

        # Security headers (replicados)
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    }

    # API proxy
    location /api {
        proxy_pass http://backend_api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Swagger docs
    location /docs {
        proxy_pass http://backend_api;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
"""

c = conn()
sftp = c.open_sftp()
# Write to a temp path then move (atomic)
tmp = "/tmp/relm-careplus.nginx.new"
with sftp.open(tmp, "w") as f:
    f.write(NEW_CONF)
sftp.close()

run(c, f"cp {tmp} /etc/nginx/sites-available/relm-careplus && echo written")
run(c, "nginx -t 2>&1")
run(c, "systemctl reload nginx && echo reloaded")

print("\n===== VERIFICACAO headers via curl =====")
run(c, "curl -sI http://127.0.0.1/ | grep -iE 'x-frame|x-content|referrer'")
run(c, "echo '--- /api/health (proxy, herda do server) ---'; curl -sI http://127.0.0.1/api/health | grep -iE 'x-frame|x-content|referrer'")
run(c, f"rm -f {tmp}; echo cleaned")
c.close()
