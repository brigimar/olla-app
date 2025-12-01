import os
from notion_client import Client
from dotenv import load_dotenv

load_dotenv()

NOTION_TOKEN = os.environ.get("NOTION_TOKEN")
PARENT_PAGE_ID = os.environ.get("NOTION_PARENT_PAGE")

if not NOTION_TOKEN:
    raise ValueError("❌ Falta NOTION_TOKEN")
if not PARENT_PAGE_ID:
    raise ValueError("❌ Falta NOTION_PARENT_PAGE")

notion = Client(auth=NOTION_TOKEN)

print("\n🔎 Verificando acceso a la página padre...")
print(f"➡️ Page ID: {PARENT_PAGE_ID}")

# -----------------------------------------
# 1. Verificar que la página exista
# -----------------------------------------
try:
    parent = notion.pages.retrieve(PARENT_PAGE_ID)
    print("✔️ La página existe y fue recuperada.")
except Exception as e:
    print("❌ No se pudo acceder a la página padre.")
    print(e)
    exit()


# -----------------------------------------
# 2. Verificar si la integración está conectada
# -----------------------------------------
print("\n🔎 Verificando conexión (Share → Add connections)...")

try:
    # Si no tenés permisos de conexión, la API tira error
    children = notion.blocks.children.list(PARENT_PAGE_ID)
    print("✔️ Integración conectada a la página.")
except Exception as e:
    print("❌ La integración NO está conectada a esta página.")
    print("👉 Solución: En Notion → Share → Add connections → Elegí tu integración.")
    exit()


# -----------------------------------------
# 3. Crear un bloque de prueba
# -----------------------------------------
print("\n🧪 Intentando crear un bloque temporal para probar permisos...")

try:
    temp = notion.blocks.children.append(
        block_id=PARENT_PAGE_ID,
        children=[
            {
                "object": "block",
                "type": "heading_3",
                "heading_3": {
                    "rich_text": [{"type": "text", "text": {"content": "🧪 Test OK"}}]
                }
            }
        ]
    )
    print("✔️ Se pudo insertar contenido. Permisos OK.")
except Exception as e:
    print("❌ No se pudo crear contenido en la página (faltan permisos).")
    print("👉 Revisá: Share → Add connections → tu integración → Can edit")
    print(e)
    exit()


# -----------------------------------------
# 4. Crear una DB mínima para validar propiedades
# -----------------------------------------
print("\n🧪 Probando creación de una base de datos mínima...")

try:
    db = notion.databases.create(
        parent={"type": "page_id", "page_id": PARENT_PAGE_ID},
        title=[{"type": "text", "text": {"content": "DB Test"}}],
        properties={
            "Nombre": {"title": {}},
            "Activo": {"checkbox": {}}
        }
    )

    print("✔️ Base de datos creada:")
    print(f"➡️ {db['id']}")

    print("\n📌 Propiedades detectadas por la API:")
    for prop in db["properties"]:
        print(f"   - {prop}")

    if len(db["properties"]) < 2:
        print("\n❌ ERROR: Notion ignoró propiedades (bug común si la integración no está conectada).")
    else:
        print("✔️ Propiedades creadas correctamente.")

except Exception as e:
    print("❌ Error creando la base de datos:")
    print(e)
    exit()

print("\n🎉 Diagnóstico completo: todo OK.")
