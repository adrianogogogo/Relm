"""Investiga rate limit: via nginx (X-Forwarded-For real) e via backend direto.
Cluster tem 2 instancias com storage in-memory separado -> 1 IP pode precisar de mais hits."""
from _ssh import conn, run

c = conn()

print("===== Via NGINX (caminho real do usuario, X-Forwarded-For setado) =====")
run(c, """for i in $(seq 1 12); do
  code=$(curl -s -o /dev/null -w '%{http_code}' -X POST http://127.0.0.1/api/auth/login -H 'Content-Type: application/json' -d '{"email":"rl-nginx@example.com","password":"x"}')
  echo "nginx POST #$i -> $code"
done""")

print("\n===== Via backend direto :3005 =====")
run(c, """for i in $(seq 1 12); do
  code=$(curl -s -o /dev/null -w '%{http_code}' -X POST http://127.0.0.1:3005/api/auth/login -H 'Content-Type: application/json' -d '{"email":"rl-direct@example.com","password":"x"}')
  echo "direct POST #$i -> $code"
done""")
c.close()
