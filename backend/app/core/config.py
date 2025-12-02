import os
from dotenv import load_dotenv

# Cargar variables desde .env
load_dotenv()

class Settings:
    # 🔗 Supabase
    SUPABASE_URL: str = os.getenv("SUPABASE_URL")
    SUPABASE_SERVICE_ROLE_KEY: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY")  # en tu .env es la service role key

    # 💳 Mercado Pago
    MP_ACCESS_TOKEN: str = os.getenv("MP_ACCESS_TOKEN")
    MP_WEBHOOK_SECRET: str = os.getenv("MP_WEBHOOK_SECRET")  # opcional

    # 🔒 Token interno de servicio
    SERVICE_TOKEN: str = os.getenv("SERVICE_TOKEN")

    # 🌐 CORS
    ALLOW_ORIGINS = os.getenv("ALLOW_ORIGINS", "*").split(",")

settings = Settings()


