from pydantic import BaseModel

class ProducerOut(BaseModel):
    id: str
    display_name: str | None
    rating: float | None
    lat: float | None
    lon: float | None
