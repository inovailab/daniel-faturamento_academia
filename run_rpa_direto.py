import os
import sys

# Adiciona a pasta atual ao caminho para conseguir importar os módulos do projeto
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from db import get_paths
from rpa import run_rpa_enter_google_folder

def rotina_cron():
    print("====================================")
    print("Iniciando RPA Diretamente via CRON")
    print("====================================")
    
    BASE_DIR, UPLOAD_DIR_IGNORED, EXTRACT_DIR = get_paths()
    extract_dir = os.path.join(EXTRACT_DIR, "temporario")
    os.makedirs(extract_dir, exist_ok=True)
    
    target_folder = os.path.join(extract_dir, "google.com")
    os.makedirs(target_folder, exist_ok=True)

    def dummy_callback():
        print("-> Processo interno de RPA finalizado na Thread.")

    # Executa a mesma exata função que o botão "Iniciar Processo" do site chama!
    # Só que de forma limpa, direta e sem precisar de um navegador invisível
    run_rpa_enter_google_folder(extract_dir, target_folder, BASE_DIR, dummy_callback)
    
    print("✅ Execução direta concluída com sucesso!")

if __name__ == "__main__":
    rotina_cron()
