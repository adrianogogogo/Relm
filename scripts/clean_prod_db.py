import paramiko
import os
import sys

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

HOST = '177.153.62.248'
PORT = 22
USER = 'root'
PASS = 'lXde@12#45'
ROOT = r'c:\Users\BOSS\Desktop\Relm\Relm-Care'
LOCAL_CLEAN_TS = ROOT + r'\backend\prisma\clean.ts'
BE = '/var/www/relm-careplus-prod/backend'

def run(c, cmd):
    _, o, e = c.exec_command(cmd)
    return o.read().decode('utf-8', 'replace'), e.read().decode('utf-8', 'replace')

def main():
    print("🔌 Conectando à VPS de produção (177.153.62.248)...")
    c = paramiko.SSHClient()
    c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        c.connect(HOST, port=PORT, username=USER, password=PASS)
        print("✅ Conectado com sucesso!")
        
        sftp = c.open_sftp()
        print("📤 Fazendo upload do script clean.ts...")
        sftp.put(LOCAL_CLEAN_TS, BE + '/prisma/clean.ts')
        sftp.close()
        print("✅ Upload concluído!")
        
        print("🧹 Executando a limpeza do banco de dados de produção...")
        out, err = run(c, f'cd {BE} && NODE_ENV=production npx ts-node prisma/clean.ts')
        
        print("\n=== SAÍDA DA EXECUÇÃO ===")
        print(out)
        
        if err.strip():
            print("=== ERROS / AVISOS ===")
            print(err)
            
    except Exception as e:
        print(f"❌ Ocorreu um erro durante a execução: {str(e)}")
    finally:
        c.close()
        print("🔌 Conexão encerrada.")

if __name__ == '__main__':
    main()
