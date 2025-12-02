import pytest
import asyncio
from app.services import payments_service
from app.db import supabase_client

@pytest.mark.asyncio
async def test_full_order_flow(monkeypatch):
    # 1. Simular creación de pedido en Supabase
    dummy_order = {
        "id": "order-123",
        "items": [{"id": "dish-1", "name": "Empanadas", "precio": 2500}],
        "is_paid": False,
        "status": "pending",
        "phone": None,
        "address": None,
    }

    # Monkeypatch insert para no golpear la DB real
    monkeypatch.setattr(
        "app.db.supabase_client.supabase_get_order_safe",
        lambda order_id: dummy_order if order_id == "order-123" else None
    )

    # 2. Simular RPC reveal_contact_info
    revealed = {
        "id": "order-123",
        "phone": "123456",
        "address": "Calle Falsa 123",
        "canReveal": True,
    }
    monkeypatch.setattr(
        "app.db.supabase_client.supabase_call_reveal_contact_info",
        lambda order_id: revealed
    )

    # 3. Simular webhook de Mercado Pago
    event = {
        "data": {
            "status": "approved",
            "order_id": "order-123",
            "amount": 5000,
        }
    }

    ok = await payments_service.process_webhook(event)

    # 4. Validar que el flujo completo funcionó
    assert ok is True
    result = supabase_client.supabase_call_reveal_contact_info("order-123")
    assert result["canReveal"] is True
    assert result["phone"] == "123456"
    assert result["address"] == "Calle Falsa 123"
