from supabase import create_client
import requests
from app.core.config import settings

# Inicializar cliente Supabase
supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)

def _headers():
    return {
        "apikey": settings.SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {settings.SUPABASE_SERVICE_ROLE_KEY}",
    }

def supabase_get_order_safe(order_id: str):
    """Ejemplo de función para obtener un pedido por ID"""
    url = f"{settings.SUPABASE_URL}/rest/v1/orders?id=eq.{order_id}&select=*"
    r = requests.get(url, headers=_headers(), timeout=10)
    r.raise_for_status()
    return r.json()

def supabase_call_reveal_contact_info(order_id: str):
    """Ejemplo de llamada RPC para revelar contacto"""
    url = f"{settings.SUPABASE_URL}/rest/v1/rpc/reveal_contact_info"
    r = requests.post(url, headers=_headers(), json={"order_id": order_id}, timeout=10)
    r.raise_for_status()
    return r.json()

if __name__ == "__main__":
    print("🔗 Probando conexión a Supabase...")
    print("SUPABASE_URL:", settings.SUPABASE_URL)
    print("SERVICE_ROLE_KEY:", settings.SUPABASE_SERVICE_ROLE_KEY[:6], "...")

    try:
        # Query simple a la tabla producers
        url = f"{settings.SUPABASE_URL}/rest/v1/producers?select=id,business_name,rating"
        r = requests.get(url, headers=_headers(), timeout=10)
        r.raise_for_status()
        rows = r.json()

        print("✅ Conexión exitosa. Productores encontrados:")
        for row in rows:
            print(f"- {row.get('id')} | {row.get('business_name')} | rating: {row.get('rating')}")
    except Exception as e:
        print("❌ Error conectando a Supabase:", e)

