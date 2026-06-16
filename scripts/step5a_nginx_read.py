"""Etapa 5 - Ler config nginx atual para planejar insercao dos headers."""
from _ssh import conn, run
c = conn()
run(c, "cat -n /etc/nginx/sites-available/relm-careplus")
c.close()
