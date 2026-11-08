import os
import shutil

PASTA_DESTINO = "simulador_pronto_para_github"

# Tudo o que NÃO vai para o GitHub (lixo de desenvolvimento)
IGNORAR = [
    "build.js", "correr_v3.bat", "distribuir.bat", "limpar_cache.bat",
    "gerar_paises.py", "servidor.py", "VER_PASTA.py", "verificar.js", "validar.js",
    "package.json", "package-lock.json", "preparar_github.py",
    "COMO_PARTILHAR.md", "LEIA-ME.txt", "NOTAS_CALIBRACAO.md",
    "validacao_resultados.csv", "validacao_resumo.md",
    "dist", "tests", "__pycache__", ".git", ".vscode", ".idea",
    "simulador_pronto_para_github"
]


def criar_pasta_limpa():
    if os.path.exists(PASTA_DESTINO):
        shutil.rmtree(PASTA_DESTINO)
    os.makedirs(PASTA_DESTINO)

    print(f"A copiar ficheiros essenciais para '{PASTA_DESTINO}'...\n")

    for item in os.listdir('.'):
        if item in IGNORAR:
            continue

        origem = os.path.join('.', item)
        destino = os.path.join(PASTA_DESTINO, item)

        if os.path.isdir(origem):
            shutil.copytree(origem, destino)
            print(f"  [+] Pasta copiada: {item}/")
        elif os.path.isfile(origem):
            shutil.copy2(origem, destino)
            print(f"  [+] Ficheiro copiado: {item}")

    print("\n" + "=" * 50)
    print(f" CONCLUÍDO! A tua pasta '{PASTA_DESTINO}' está pronta.")
    print(" Esta pasta contém APENAS o que o site precisa.")
    print("=" * 50)


if __name__ == "__main__":
    criar_pasta_limpa()