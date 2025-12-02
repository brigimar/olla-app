from pydantic import BaseModel
from typing import Optional

class Order(BaseModel):
    id: str
    is_paid: bool
    pickup_at: Optional[str]
    phone: Optional[str] = None
    address: Optional[str] = None
    status: Optional[str] = None
    canReveal: Optional[bool] = False

