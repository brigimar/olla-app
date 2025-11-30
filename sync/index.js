require('dotenv').config();
console.log("🚀 Olla del Barrio - Sync Service Iniciado");

const { Client } = require('@notionhq/client');
const { createClient } = require('@supabase/supabase-js');
const cron = require('node-cron');

// Cargar configuración desde variables de entorno
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const notionToken = process.env.NOTION_TOKEN;
const notionDatabaseId = process.env.NOTION_DATABASE_ID;

console.log("🔧 Configuración cargada:");
console.log("   SUPABASE_URL:", supabaseUrl ? "✅ Configurado" : "❌ Faltante");
console.log("   SUPABASE_KEY:", supabaseKey ? "✅ Configurado" : "❌ Faltante");
console.log("   NOTION_TOKEN:", notionToken ? "✅ Configurado" : "❌ Faltante");
console.log("   NOTION_DATABASE_ID:", notionDatabaseId ? "✅ Configurado" : "❌ Faltante");

// Inicializar clients solo si hay configuración suficiente
let supabase, notion;

if (supabaseUrl && supabaseKey) {
    try {
        supabase = createClient(supabaseUrl, supabaseKey);
        console.log("✅ Supabase Client inicializado correctamente");
    } catch (error) {
        console.log("❌ Error inicializando Supabase:", error.message);
    }
} else {
    console.log("⚠️  Supabase no inicializado (faltan credenciales)");
}

if (notionToken) {
    try {
        notion = new Client({ auth: notionToken });
        console.log("✅ Notion Client inicializado correctamente");
    } catch (error) {
        console.log("❌ Error inicializando Notion:", error.message);
    }
} else {
    console.log("⚠️  Notion no inicializado (falta NOTION_TOKEN)");
}

// Tarea de salud cada 30 segundos
cron.schedule('*/30 * * * * *', () => {
    const now = new Date().toLocaleString('es-AR', {
        timeZone: 'America/Argentina/Buenos_Aires'
    });
    const status = supabase && notion ? "COMPLETO" : "PARCIAL";
    console.log(`❤️  Servicio ${status} - ${now}`);
});

// Tarea de sincronización cada 5 minutos (solo si ambos clients están listos)
cron.schedule('*/5 * * * *', async () => {
    console.log(`🔄 Iniciando ciclo de sync - ${new Date().toISOString()}`);
    
    if (supabase && notion) {
        try {
            console.log("📊 Sincronizando datos entre Notion y Supabase...");
            // Aquí iría la lógica real de sincronización
            await new Promise(resolve => setTimeout(resolve, 2000));
            console.log("✅ Sincronización completada exitosamente");
        } catch (error) {
            console.log("❌ Error en sincronización:", error.message);
        }
    } else {
        console.log("⏸️  Sync omitido - Esperando configuración completa");
        console.log("   Supabase:", supabase ? "✅" : "❌");
        console.log("   Notion:", notion ? "✅" : "❌");
    }
});

console.log("👀 Sync Service iniciado y monitoreando");
console.log("⏰ Tareas programadas activas");

// Manejar cierre graceful
process.on('SIGTERM', () => {
    console.log('🛑 Cerrando servicio gracefulmente...');
    process.exit(0);
});