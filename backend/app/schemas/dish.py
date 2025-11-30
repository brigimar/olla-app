from pydantic import BaseModel

class DishCreate(BaseModel):
    nombre: str
    descripcion: str | None
    precio: int
    envio: bool = True
    retiro_gratis: bool = False

class DishOut(DishCreate):
    id: str
    productor_id: str
