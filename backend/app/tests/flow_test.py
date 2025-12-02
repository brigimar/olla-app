"""
Script de prueba para el flujo completo de pedidos en Supabase.
Incluye: creación de pedido, simulación de pago y revelación de contacto.
"""

import os
import requests
from datetime import datetime, timezone
from typing import Optional, Dict, Any

# Configuración de Supabase
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY")  # Usa el service role key

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("Faltan variables de entorno: SUPABASE_URL y SUPABASE_SERVICE_KEY")

HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation"
}


def get_first_valid_id(table: str) -> Optional[str]:
    """Obtiene el primer id válido de una tabla dada."""
    try:
        response = requests.get(
            f"{SUPABASE_URL}/rest/v1/{table}",
            headers=HEADERS,
            params={"select": "id", "limit": 1}
        )
        response.raise_for_status()
        rows = response.json()
        if rows:
            print(f"✓ {table.capitalize()} ID encontrado: {rows[0]['id']}")
            return rows[0]["id"]
        else:
            print(f"⚠ No se encontraron registros en la tabla {table}")
            return None
    except Exception as e:
        print(f"✗ Error obteniendo id de {table}: {e}")
        return None


def ensure_test_profile() -> Optional[str]:
    """Garantiza que exista al menos un perfil en la tabla profiles."""
    profile_id = get_first_valid_id("profiles")
    if profile_id:
        return profile_id

    print("❌ No hay perfiles disponibles en la tabla 'profiles'.")
    print("   Debes crear un usuario en auth.users y su perfil asociado en profiles.")
    return None


def create_order(client_id: str, producer_id: str) -> Optional[Dict[str, Any]]:
    """Crea un nuevo pedido en Supabase."""
    now = datetime.now(timezone.utc).isoformat()
    payload = {
        "client_id": client_id,
        "producer_id": producer_id,
        "status": "pending",
        "delivery_address": "Calle Falsa 123, Buenos Aires",
        "subtotal_cents": 2500,
        "commission_cents": 250,
        "total_cents": 2750,
        "created_at": now,
        "updated_at": now
    }

    print("\n📝 Creando pedido...")
    try:
        response = requests.post(
            f"{SUPABASE_URL}/rest/v1/orders",
            headers=HEADERS,
            json=payload
        )
        print("Respuesta Supabase:", response.text)  # debug
        response.raise_for_status()
        order = response.json()
        if isinstance(order, list) and order:
            order = order[0]
        print(f"✓ Pedido creado exitosamente! ID: {order.get('id')}")
        return order
    except requests.exceptions.HTTPError as e:
        print(f"✗ Error HTTP al crear pedido: {e}")
        print(f"  Response: {e.response.text}")
        return None


def mark_order_as_paid(order_id: str) -> bool:
    """Actualiza el pedido marcándolo como confirmado (pagado)."""
    now = datetime.now(timezone.utc).isoformat()
    payload = {
        "status": "confirmed",   # usa el valor correcto del enum
        "paid_at": now,
        "updated_at": now
    }
    print(f"\n💳 Marcando pedido {order_id} como confirmado/pagado...")
    try:
        response = requests.patch(
            f"{SUPABASE_URL}/rest/v1/orders",
            headers=HEADERS,
            params={"id": f"eq.{order_id}"},
            json=payload
        )
        print("Respuesta Supabase:", response.text)  # debug
        response.raise_for_status()
        print("✓ Pedido marcado como confirmado/pagado exitosamente!")
        return True
    except Exception as e:
        print(f"✗ Error al actualizar pedido: {e}")
        return False



def reveal_contact_info(order_id: str) -> bool:
    """Ejecuta la RPC para revelar información de contacto."""
    print(f"\n🔓 Revelando información de contacto para pedido {order_id}...")
    try:
        response = requests.post(
            f"{SUPABASE_URL}/rest/v1/rpc/reveal_contact_info",
            headers=HEADERS,
            json={"order_id": order_id}
        )
        print("Respuesta Supabase:", response.text)  # debug
        response.raise_for_status()
        result = response.json()
        print("✓ Información de contacto revelada:", result)
        return True
    except Exception as e:
        print(f"✗ Error al revelar contacto: {e}")
        return False


def main():
    print("=" * 60)
    print("🚀 INICIANDO FLUJO DE PRUEBA DE PEDIDOS")
    print("=" * 60)

    client_id = ensure_test_profile()
    producer_id = get_first_valid_id("producers")

    if not client_id or not producer_id:
        print("❌ ERROR: No se pudieron obtener IDs válidos.")
        return

    order = create_order(client_id, producer_id)
    if not order or not order.get("id"):
        print("❌ ERROR: No se pudo crear el pedido.")
        return

    order_id = order["id"]

    if not mark_order_as_paid(order_id):
        print("❌ ERROR: No se pudo marcar el pedido como pagado.")
        return

    if not reveal_contact_info(order_id):
        print("❌ ERROR: No se pudo revelar la información de contacto.")
        return

    print("=" * 60)
    print("✅ FLUJO COMPLETADO EXITOSAMENTE")
    print("=" * 60)


if __name__ == "__main__":
    main()
