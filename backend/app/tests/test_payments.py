import pytest
import asyncio
from app.services import payments_service

# Simulamos el RPC de Supabase
class DummySupabase:
    def __init__(self):
        self.called_with = None

    def call(self, order_id: str):
        self.called_with = order_id
        return {"id": order_id, "phone": "123456", "address": "Calle Falsa 123", "canReveal": True}

@pytest.mark.asyncio
async def test_process_webhook_calls_reveal(monkeypatch):
    dummy = DummySupabase()

    # Monkeypatch la función real
    monkeypatch.setattr(
        "app.db.supabase_client.supabase_call_reveal_contact_info",
        dummy.call
    )

    # Simulamos evento de Mercado Pago
    event = {
        "data": {
            "status": "approved",
            "order_id": "order-123",
            "amount": 5000
        }
    }

    ok = await payments_service.process_webhook(event)

    assert ok is True
    assert dummy.called_with == "order-123"

@pytest.mark.asyncio
async def test_process_webhook_rejects_unapproved(monkeypatch):
    dummy = DummySupabase()
    monkeypatch.setattr(
        "app.db.supabase_client.supabase_call_reveal_contact_info",
        dummy.call
    )

    event = {
        "data": {
            "status": "pending",
            "order_id": "order-456",
            "amount": 3000
        }
    }

    ok = await payments_service.process_webhook(event)

    assert ok is False
    assert dummy.called_with is None
