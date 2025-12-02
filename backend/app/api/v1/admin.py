from fastapi import APIRouter

router = APIRouter()

@router.get("/admin/metrics")
async def metrics():
    return {"orders": 120, "producers": 12, "bypasses": 2}

@router.get("/admin/bypasses")
async def bypasses():
    return [
        {"order_id": "o1", "description": "Intento compartir teléfono"},
        {"order_id": "o2", "description": "Alias MP en chat"}
    ]

@router.get("/admin/export/excel")
async def export_excel():
    return {"url": "/download/metrics.xlsx"}
