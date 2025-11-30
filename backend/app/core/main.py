from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.api.v1 import router as v1_router

# Crear la aplicación FastAPI
app = FastAPI(
    title="Buenos Pasos API",
    version="1.0.0",
    description="API de ejemplo para el proyecto Buenos Pasos"
)

# Configuración de CORS (útil para frontend Next.js)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # en producción conviene restringir
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Endpoint raíz
@app.get("/")
def root():
    return {"message": "Hola Buenos Pasos 🚀"}

# Endpoint de healthcheck (para Docker y monitoreo)
@app.get("/health")
def health():
    return {"status": "ok"}

# Incluir routers de la carpeta v1
app.include_router(v1_router.api_router, prefix="/api/v1")

# Manejo global de errores
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"error": str(exc), "path": request.url.path},
    )
