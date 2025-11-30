Write-Host "=== Ejecutando backend_fix.ps1 ==="

$Backend = $PSScriptRoot
$App = Join-Path $Backend "app"

# -----------------------------------------------------
# 1. Crear estructura de carpetas
# -----------------------------------------------------
$folders = @(
    "api/v1",
    "core",
    "db",
    "models",
    "schemas",
    "services",
    "utils"
)

foreach ($folder in $folders) {
    $path = Join-Path $App $folder
    if (!(Test-Path $path)) {
        New-Item -ItemType Directory -Path $path | Out-Null
        Write-Host "Created folder: $folder"
    } else {
        Write-Host "Folder exists: $folder"
    }
}

# -----------------------------------------------------
# 2. Crear __init__.py en TODAS las carpetas
# -----------------------------------------------------
$allDirs = Get-ChildItem -Path $App -Recurse -Directory
foreach ($dir in $allDirs) {
    $initFile = Join-Path $dir.FullName "__init__.py"
    if (!(Test-Path $initFile)) {
        New-Item -ItemType File -Path $initFile | Out-Null
        Write-Host "Added __init__.py in: $($dir.FullName)"
    }
}

# -----------------------------------------------------
# 3. Crear archivos base
# -----------------------------------------------------
$filesToCreate = @{
    "main.py" = @"
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.router import api_router

app = FastAPI(title='Backend API')

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_methods=['*'],
    allow_headers=['*'],
)

app.include_router(api_router, prefix='/api/v1')

@app.get('/health')
def health():
    return {'status': 'ok'}
"@

    "api/v1/router.py" = @"
from fastapi import APIRouter
from .payments import router as payments_router

api_router = APIRouter()
api_router.include_router(payments_router, prefix='/payments', tags=['Payments'])
"@

    "core/config.py" = @"
import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    SUPABASE_URL: str = os.getenv('SUPABASE_URL')
    SUPABASE_KEY: str = os.getenv('SUPABASE_KEY')
    MERCADOPAGO_TOKEN: str = os.getenv('MERCADOPAGO_TOKEN')

settings = Settings()
"@

    "db/supabase_client.py" = @"
from supabase import create_client
from app.core.config import settings

supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
"@

    "utils/logger.py" = @"
import logging

logging.basicConfig(
    level=logging.INFO,
    format='[%(asctime)s] [%(levelname)s] %(message)s'
)

logger = logging.getLogger(__name__)
"@

    "schemas/payment.py" = @"
from pydantic import BaseModel

class PaymentWebhook(BaseModel):
    id: str
    type: str
"@

    "services/payments_service.py" = @"
from app.utils.logger import logger

def process_webhook(data: dict):
    logger.info(f'Received Mercado Pago webhook: {data}')
    return {'received': True}
"@

    "api/v1/payments.py" = @"
from fastapi import APIRouter, Request
from app.schemas.payment import PaymentWebhook
from app.services.payments_service import process_webhook

router = APIRouter()

@router.post('/webhook')
async def webhook(request: Request):
    body = await request.json()
    return process_webhook(body)
"@
}

foreach ($file in $filesToCreate.Keys) {
    $path = Join-Path $App $file

    if (!(Test-Path $path)) {
        $dir = Split-Path $path
        if (!(Test-Path $dir)) {
            New-Item -ItemType Directory -Path $dir | Out-Null
        }

        Set-Content -Path $path -Value $filesToCreate[$file] -Encoding UTF8
        Write-Host "Created file: $file"
    } else {
        Write-Host "File exists (not overwritten): $file"
    }
}

Write-Host "`n=== Backend fix completed successfully ==="
