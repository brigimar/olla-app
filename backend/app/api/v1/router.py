from fastapi import APIRouter
from . import orders, payments, producers

api_router = APIRouter()

api_router.include_router(orders.router, prefix="/orders", tags=["orders"])
api_router.include_router(payments.router, prefix="/payments", tags=["payments"])
api_router.include_router(producers.router, prefix="/producers", tags=["producers"])
