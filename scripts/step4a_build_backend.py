"""Etapa 4a - Build do backend no servidor (nest build) e verificacao do dist novo."""
from _ssh import conn, run

c = conn()
BE = "/var/www/relm-careplus-prod/backend"

# Remove old dist and rebuild
run(c, f"cd {BE} && rm -rf dist && npm run build 2>&1 | tail -15", timeout=300)
run(c, f"ls -la {BE}/dist/main.js")
run(c, f"grep -l helmet {BE}/dist/main.js && echo HELMET_IN_DIST")
run(c, f"grep -rl Throttler {BE}/dist/ | head -3")
c.close()
