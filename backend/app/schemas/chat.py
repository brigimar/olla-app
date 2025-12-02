from pydantic import BaseModel

class ChatMessage(BaseModel):
    id: str
    order_id: str
    text: str
    created_at: str
