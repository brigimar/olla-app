from fastapi import APIRouter

router = APIRouter()

@router.get("/")
def list_payments():
    return [{"id": 1, "status": "Paid"}]
