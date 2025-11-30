import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    SUPABASE_URL: str = os.getenv("SUPABASE_URL")
    SUPABASE_KEY: str = os.getenv("SUPABASE_KEY")
    MP_ACCESS_TOKEN: str = os.getenv("MP_ACCESS_TOKEN")
    MP_WEBHOOK_SECRET: str = os.getenv("MP_WEBHOOK_SECRET")  # optional
    ALLOW_ORIGINS = os.getenv("ALLOW_ORIGINS", "*").split(",")

settings = Settings()

