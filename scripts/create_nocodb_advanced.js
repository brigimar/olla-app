/**
 * Script avanzado para NocoDB
 * - Crea tablas Producers y Dishes con relaciones, defaults y constraints
 * - Inserta datos iniciales (seed)
 */

const NOCODB_API_URL = process.env.NOCODB_API_URL; 
const NOCODB_AUTH_TOKEN = process.env.NOCODB_AUTH_TOKEN;

if (!NOCODB_API_URL || !NOCODB_AUTH_TOKEN) {
    console.error("Define NOCODB_API_URL y NOCODB_AUTH_TOKEN en variables de entorno");
    process.exit(1);
}

const headers = {
    "Content-Type": "application/json",
    "xc-token": NOCODB_AUTH_TOKEN
};

// ----------------------
// 1. Crear tabla Producers
// ----------------------
async function createProducersTable() {
    const url = `${NOCODB_API_URL}/api/v1/db/meta/tables`;
    const body = {
        name: "Producers",
        columns: [
            { name: "id", type: "uuid", primary: true, auto_generate: true },
            { name: "business_name", type: "text", required: true },
            { name: "description", type: "text" },
            { name: "address", type: "text" },
            { name: "is_active", type: "boolean", default: true },
            { name: "rating", type: "numeric", default: 0 }
        ]
    };
    const res = await fetch(url, { method: "POST", headers, body: JSON.stringify(body) });
    const data = await res.json();
    if (!res.ok) console.error("Error Producers:", data); 
    else console.log("Tabla Producers creada:", data.name || data);
}

// ----------------------
// 2. Crear tabla Dishes
// ----------------------
async function createDishesTable() {
    const url = `${NOCODB_API_URL}/api/v1/db/meta/tables`;
    const body = {
        name: "Dishes",
        columns: [
            { name: "id", type: "uuid", primary: true, auto_generate: true },
            { 
                name: "producer_id", 
                type: "uuid", 
                link: "Producers", 
                required: true 
            },
            { name: "name", type: "text", required: true },
            { name: "description", type: "text" },
            { name: "price_cents", type: "integer", required: true, default: 1000 },
            { name: "category", type: "text" },
            { name: "is_available", type: "boolean", default: true },
            { name: "preparation_time_minutes", type: "integer" },
            { name: "status", type: "text", default: "active" },
            { name: "rating", type: "numeric", default: 0 },
            { name: "city", type: "text" }
        ]
    };
    const res = await fetch(url, { method: "POST", headers, body: JSON.stringify(body) });
    const data = await res.json();
    if (!res.ok) console.error("Error Dishes:", data); 
    else console.log("Tabla Dishes creada:", data.name || data);
}

// ----------------------
// 3. Insertar datos seed
// ----------------------
async function seedData() {
    // Crear productor de ejemplo
    const producer = {
        business_name: "Panadería del Barrio",
        description: "Pan artesanal",
        address: "Av. Siempre Viva 123",
        is_active: true,
        rating: 4.5
    };

    const resProducer = await fetch(`${NOCODB_API_URL}/api/v1/db/data/v1/app/Producers`, {
        method: "POST",
        headers,
        body: JSON.stringify(producer)
    });
    const producerData = await resProducer.json();
    const producerId = producerData.id;
    console.log("Seed Producer creado:", producerData);

    // Crear platos de ejemplo
    const dishes = [
        { producer_id: producerId, name: "Milanesa", price_cents: 1200, category: "plato_principal", city: "Buenos Aires" },
        { producer_id: producerId, name: "Empanada", price_cents: 500, category: "entrada", city: "Buenos Aires" },
        { producer_id: producerId, name: "Pizza", price_cents: 1500, category: "plato_principal", city: "Córdoba" }
    ];

    for (const dish of dishes) {
        const resDish = await fetch(`${NOCODB_API_URL}/api/v1/db/data/v1/app/Dishes`, {
            method: "POST",
            headers,
            body: JSON.stringify(dish)
        });
        const dishData = await resDish.json();
        console.log("Dish creado:", dishData.name);
    }
}

// ----------------------
// 4. Ejecutar todo
// ----------------------
(async () => {
    console.log("Creando tabla Producers...");
    await createProducersTable();

    console.log("Creando tabla Dishes...");
    await createDishesTable();

    console.log("Insertando datos seed...");
    await seedData();

    console.log("✅ Tablas y datos iniciales creados en NocoDB");
})();
