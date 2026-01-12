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

    # Se já existir token.json, tenta reutilizar
    if os.path.exists('token.json'):
        creds = Credentials.from_authorized_user_file('token.json', SCOPES)

    # Se não existir ou estiver inválido, inicia fluxo de login
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            print("🔄 Refreshing token...")
            creds.refresh(Request())
        else:
            print("🌐 Abrindo navegador para autenticação...")
            flow = InstalledAppFlow.from_client_secrets_file(
                'credentials.json',
                SCOPES
            )
            creds = flow.run_local_server(port=0)

        # Salva token.json para uso futuro
        with open('token.json', 'w') as token:
            token.write(creds.to_json())

        print("✅ token.json gerado com sucesso!")

    else:
        print("✔ token.json já existe e é válido.")

if __name__ == '__main__':
    gerar_token()
