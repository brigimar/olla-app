# generate-v1-files.ps1
# Script para generar archivos .py completos en backend/app/api/v1/

$basePath = "E:\BuenosPasos\boilerplate\backend\app\api\v1"

Write-Host "🔄 Generando archivos base en $basePath ..."

# Crear router.py
@"
from fastapi import APIRouter
from . import orders, payments, producers

api_router = APIRouter()

api_router.include_router(orders.router, prefix="/orders", tags=["orders"])
api_router.include_router(payments.router, prefix="/payments", tags=["payments"])
api_router.include_router(producers.router, prefix="/producers", tags=["producers"])
"@ | Set-Content "$basePath\router.py"

# Crear orders.py
@"
from fastapi import APIRouter

router = APIRouter()

@router.get("/")
def list_orders():
    return [{"id": 1, "item": "Demo Order"}]
"@ | Set-Content "$basePath\orders.py"

# Crear payments.py
@"
from fastapi import APIRouter

router = APIRouter()

@router.get("/")
def list_payments():
    return [{"id": 1, "status": "Paid"}]
"@ | Set-Content "$basePath\payments.py"

# Crear producers.py
@"
from fastapi import APIRouter

router = APIRouter()

@router.get("/")
def list_producers():
    return [{"id": 1, "name": "Demo Producer"}]
"@ | Set-Content "$basePath\producers.py"

Write-Host "✅ Archivos .py generados correctamente en /v1/"
