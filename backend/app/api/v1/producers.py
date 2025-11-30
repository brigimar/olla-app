from fastapi import APIRouter

router = APIRouter()

@router.get("/")
def list_producers():
    return [{"id": 1, "name": "Demo Producer"}]
