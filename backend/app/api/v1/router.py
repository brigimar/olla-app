from fastapi import APIRouter
from . import dishes, orders, payments, producers, admin

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(dishes.router, prefix="/dishes", tags=["dishes"])
api_router.include_router(orders.router, prefix="/orders", tags=["orders"])
api_router.include_router(payments.router, prefix="/payments", tags=["payments"])
api_router.include_router(producers.router, prefix="/producers", tags=["producers"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
