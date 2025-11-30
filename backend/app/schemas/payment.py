from pydantic import BaseModel

class PaymentWebhook(BaseModel):
    id: str
    type: str
