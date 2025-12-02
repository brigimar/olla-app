import pytest
from app.api.v1.orders import sanitize_order_payload

def test_order_reveal_only_with_payment_and_window():
    order = {
        "id": "o1",
        "is_paid": True,
        "pickup_at": "2099-01-01T12:00:00Z",
        "phone": "123456",
        "address": "Calle Falsa 123"
    }
    safe = sanitize_order_payload(order)
    assert safe["phone"] is None
    assert safe["canReveal"] is False
