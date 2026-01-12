# auth_gmail.py
import os
import pickle
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials

# Escopo necessário apenas para enviar emails
SCOPES = ['https://www.googleapis.com/auth/gmail.send']

def gerar_token():
    """
    Roda o fluxo OAuth padrão do Google, lendo o credentials.json
    e gerando token.json automaticamente.
    """
    creds = None

    # Tenta carregar credenciais do ambiente (.env)
    token_from_env = os.getenv("GOOGLE_TOKEN")
    
    if token_from_env:
        token_info = {
            "token": os.getenv("GOOGLE_TOKEN"),
            "refresh_token": os.getenv("GOOGLE_REFRESH_TOKEN"),
            "token_uri": os.getenv("GOOGLE_TOKEN_URI"),
            "client_id": os.getenv("GOOGLE_CLIENT_ID"),
            "client_secret": os.getenv("GOOGLE_CLIENT_SECRET"),
            "scopes": os.getenv("GOOGLE_SCOPES", "").split(","),
            "universe_domain": os.getenv("GOOGLE_UNIVERSE_DOMAIN"),
            "expiry": os.getenv("GOOGLE_EXPIRY")
        }
        creds = Credentials.from_authorized_user_info(token_info, SCOPES)
    elif os.path.exists('token.json'):
        creds = Credentials.from_authorized_user_file('token.json', SCOPES)

    # Se não existir ou estiver inválido, inicia fluxo de login
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            print("🔄 Refreshing token...")
            try:
                creds.refresh(Request())
            except Exception as e:
                print(f"❌ Erro ao dar refresh: {e}")
                creds = None
        
        if not creds or not creds.valid:
            print("🌐 Abrindo navegador para autenticação...")
            flow = InstalledAppFlow.from_client_secrets_file(
                'credentials.json',
                SCOPES
            )
            creds = flow.run_local_server(port=0)

        # Salva token.json (para compatibilidade local, mas ignorado pelo git)
        with open('token.json', 'w') as token:
            token.write(creds.to_json())

        print("✅ token.json gerado/atualizado com sucesso!")
        print("\n" + "="*50)
        print("⚠️  ATENÇÃO: Você deve atualizar o seu arquivo .env com os novos valores!")
        print("Copie o conteúdo do token.json para as variáveis GOOGLE_* no .env.")
        print("="*50 + "\n")

    else:
        print("✔ Credenciais já são válidas (carregadas do .env ou token.json).")

if __name__ == '__main__':
    gerar_token()
