from fastapi import APIRouter, HTTPException
from app.db.supabase_client import supabase

router = APIRouter()

@router.get("/popular")
def get_popular_dishes(limit: int = 10, city: str | None = None):
    """
    Devuelve una lista de platos populares desde Supabase.
    Se puede filtrar por ciudad y limitar la cantidad.
    """
    try:
        query = supabase.table("dishes").select("*").limit(limit)
        if city:
            query = query.eq("city", city)
        data = query.execute()
        return data.data or []   # devuelve lista vacía si no hay registros
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener platos: {str(e)}")


@router.get("/{dish_id}")
def get_dish(dish_id: str):
    """
    Devuelve un plato específico por su ID.
    """
    try:
        data = (
            supabase.table("dishes")
            .select("*")
            .eq("id", dish_id)
            .single()
            .execute()
        )
        if not data.data:
            raise HTTPException(status_code=404, detail="Plato no encontrado")
        return data.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener plato: {str(e)}")

