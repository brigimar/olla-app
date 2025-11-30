from fastapi import APIRouter, HTTPException
from app.db.supabase_client import supabase

router = APIRouter()

@router.get("/")
def list_orders():
    try:
        # Consultar todos los registros de la tabla "orders"
        response = supabase.table("orders").select("*").execute()

        if response.error:
            raise HTTPException(status_code=500, detail=response.error.message)

        return response.data

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
