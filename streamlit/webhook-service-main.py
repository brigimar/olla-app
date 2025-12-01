# webhook-service/main.py
from fastapi import FastAPI, Request, HTTPException
from pydantic import BaseModel
from datetime import datetime
import os
import asyncio
from supabase import create_client
from notifier.notifier import notify_bypass_if_needed

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

app = FastAPI(title="Olla Webhooks")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise RuntimeError("SUPABASE_URL and SUPABASE_KEY must be set")

sb = create_client(SUPABASE_URL, SUPABASE_KEY)

class BypassEvent(BaseModel):
    order_id: int
    producer_id: str
    reason: str
    score: float = 0.0
    meta: dict = {}

@app.post("/webhook/bypass")
async def bypass(event: BypassEvent, request: Request):
    payload = event.dict()
    payload["created_at"] = datetime.utcnow().isoformat()
    # store in supabase table 'bypass_alerts'
    try:
        res = sb.table("bypass_alerts").insert(payload).execute()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    # async notify (don't block the webhook)
    asyncio.create_task(notify_bypass_if_needed(payload, sb))
    return {"status": "received", "id": res.data if hasattr(res, "data") else res}
