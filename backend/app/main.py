from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api.v1.router import api_router # Importa el router principal que agrupa todos los endpoints V1

# --- Importar Configuración ---
# En un proyecto real, se importa la instancia de configuración desde app.core.config
# para obtener dinámicamente el título, versión y lista de orígenes CORS.
# from .core.config import settings 


# La instancia de FastAPI
app = FastAPI(
    title="Servicio de Pedidos - Core API", # Usar settings.PROJECT_TITLE
    description="Servicio backend modular para la aplicación de comidas.", # Usar settings.PROJECT_DESCRIPTION
    version="1.0.1", # Usar settings.PROJECT_VERSION
)

# Configuración de CORS
# Idealmente, esta lista proviene de la configuración (settings.CORS_ORIGINS)
origins = [
    "http://localhost:3000",  # Entorno de desarrollo local de Next.js
    "https://frontend.mi-dominio.com", # Ejemplo de URL de producción
    # Añade aquí más orígenes si es necesario
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Montar Routers ---
# Conectamos el router principal V1 (que agrupa pagos, pedidos, finanzas, etc.)
app.include_router(api_router, prefix="/api/v1") 

@app.get("/")
def read_root():
    """Endpoint de prueba para verificar que el servidor está funcionando."""
    return {"message": "API está activa y funcionando."}

# Nota: El servidor Uvicorn buscará esta instancia 'app' al iniciar.