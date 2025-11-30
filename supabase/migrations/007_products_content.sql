-- Crear tabla para almacenar contenido sincronizado desde Notion
CREATE TABLE IF NOT EXISTS products_content (
    notion_id TEXT PRIMARY KEY,
    title TEXT,
    description TEXT,
    tags TEXT[],
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE products_content ENABLE ROW LEVEL SECURITY;

-- Políticas RLS (ajustar según necesidades)
-- Permitir acceso público para lectura (opcional)
CREATE POLICY "Allow public read access" ON products_content
    FOR SELECT USING (true);

-- Permitir inserción/actualización solo desde el servicio de sincronización (usando service_key)
-- Nota: Al usar la service_key, se bypass RLS, por lo que no es necesaria una política para INSERT/UPDATE.