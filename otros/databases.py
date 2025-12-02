import os
from notion_client import Client
from dotenv import load_dotenv

load_dotenv()

NOTION_API_KEY = os.getenv("NOTION_API_KEY")
PARENT_PAGE = os.getenv("NOTION_PARENT_PAGE")

if not NOTION_API_KEY:
    raise ValueError("❌ Falta NOTION_API_KEY en el .env")

if not PARENT_PAGE:
    raise ValueError("❌ Falta NOTION_PARENT_PAGE en el .env")

notion = Client(auth=NOTION_API_KEY)

print("\n🔎 Verificando acceso a la página padre...")
print(f"➡️ Page ID: {PARENT_PAGE}")

# Verificar si existe la página
page = notion.pages.retrieve(PARENT_PAGE)
print("✔️ La página existe y fue recuperada.")


# =====================================================
# 🔨 CREAR BASE DE DATOS CON PROPIEDADES VISIBLES
# =====================================================
def crear_db(nombre):
    print(f"\n🧪 Creando base de datos: {nombre}")

    schema = {
        "Nombre": {"title": {}},
        "Estado": {
            "select": {
                "options": [
                    {"name": "Activo", "color": "green"},
                    {"name": "Inactivo", "color": "red"}
                ]
            }
        },
        "Precio": {"number": {"format": "number"}},
        "Descripción": {"rich_text": {}},
        "Fecha creación": {"created_time": {}},
    }

    db = notion.databases.create(
        parent={"type": "page_id", "page_id": PARENT_PAGE},
        title=[{"type": "text", "text": {"content": nombre}}],
        properties=schema
    )

    print("✔️ Base de datos creada: ", db["id"])

    print("\n📌 Propiedades detectadas por la API:")
    for key, value in db["properties"].items():
        print(f"  - {key}: {value['type']}")

    print("\nℹ️ Si no ves las columnas en Notion:")
    print("   → Cambiá la vista a 'Table'.")
    print("   → Activá 'Properties' en la parte superior.")
    print("   → Notion oculta propiedades nuevas por defecto.\n")

    return db


# =====================================================
# 🚀 EJECUCIÓN
# =====================================================
try:
    crear_db("DB Test GPT 2")
except Exception as e:
    print("❌ Error creando base de datos:")
    print(e)
