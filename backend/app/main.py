from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.router import api_router

app = FastAPI(
    title="Servicio de Pedidos - Core API",
    description="Servicio backend modular para la aplicación de comidas.",
    version="1.0.1",
)

origins = [
    "http://localhost:3000",
    "https://frontend.mi-dominio.com",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)

@app.get("/")
def read_root():
    return {"message": "API está activa y funcionando."}
