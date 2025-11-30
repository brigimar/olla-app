-- Archivo de migración: 003_seed_data.sql
-- Geógrafo: Gemini (Modelo de IA)
-- Propósito: Insertar 48 zonas de delivery aproximadas (Polígonos PostGIS) para CABA y GBA.
-- NOTA: Las coordenadas están en formato WGS 84 (SRID 4326) y son simplificadas (bounding boxes).
-- Formato de coordenadas en PostGIS: LONGITUD LATITUD

-- Insertar zonas de delivery (idempotente)
-- Calculamos center_point automáticamente desde el polígono
INSERT INTO public.delivery_zones (name, polygon, center_point) 
SELECT 
    name,
    polygon,
    ST_Centroid(polygon) AS center_point
FROM (VALUES
-- --------------------------------------------------------------------------
-- CABA: ZONAS NORTE Y ESTE (COBERTURA PREMIUM)
-- --------------------------------------------------------------------------
('Palermo', ST_GeomFromText('POLYGON((-58.43 -34.56, -58.40 -34.56, -58.40 -34.58, -58.43 -34.58, -58.43 -34.56))', 4326)),
('Recoleta', ST_GeomFromText('POLYGON((-58.40 -34.58, -58.38 -34.58, -58.38 -34.60, -58.40 -34.60, -58.40 -34.58))', 4326)),
('Belgrano', ST_GeomFromText('POLYGON((-58.48 -34.54, -58.43 -34.54, -58.43 -34.56, -58.48 -34.56, -58.48 -34.54))', 4326)),
('Retiro', ST_GeomFromText('POLYGON((-58.37 -34.58, -58.35 -34.58, -58.35 -34.60, -58.37 -34.60, -58.37 -34.58))', 4326)),
('Puerto Madero', ST_GeomFromText('POLYGON((-58.36 -34.59, -58.35 -34.59, -58.35 -34.62, -58.36 -34.62, -58.36 -34.59))', 4326)),
('San Nicolás (Microcentro)', ST_GeomFromText('POLYGON((-58.38 -34.60, -58.36 -34.60, -58.36 -34.61, -58.38 -34.61, -58.38 -34.60))', 4326)),
('Balvanera (Once)', ST_GeomFromText('POLYGON((-58.42 -34.60, -58.40 -34.60, -58.40 -34.62, -58.42 -34.62, -58.42 -34.60))', 4326)),
('San Telmo', ST_GeomFromText('POLYGON((-58.37 -34.62, -58.36 -34.62, -58.36 -34.63, -58.37 -34.63, -58.37 -34.62))', 4326)),
('Montserrat', ST_GeomFromText('POLYGON((-58.38 -34.61, -58.37 -34.61, -58.37 -34.62, -58.38 -34.62, -58.38 -34.61))', 4326)),
('La Boca', ST_GeomFromText('POLYGON((-58.37 -34.63, -58.35 -34.63, -58.35 -34.65, -58.37 -34.65, -58.37 -34.63))', 4326)),
('Barracas', ST_GeomFromText('POLYGON((-58.39 -34.64, -58.37 -34.64, -58.37 -34.66, -58.39 -34.66, -58.39 -34.64))', 4326)),
('Parque Patricios', ST_GeomFromText('POLYGON((-58.41 -34.63, -58.39 -34.63, -58.39 -34.65, -58.41 -34.65, -58.41 -34.63))', 4326)),
('Nueva Pompeya', ST_GeomFromText('POLYGON((-58.43 -34.65, -58.41 -34.65, -58.41 -34.67, -58.43 -34.67, -58.43 -34.65))', 4326)),

-- --------------------------------------------------------------------------
-- CABA: ZONAS CENTRO Y OESTE (ALTA DENSIDAD)
-- --------------------------------------------------------------------------
('Almagro', ST_GeomFromText('POLYGON((-58.43 -34.59, -58.41 -34.59, -58.41 -34.61, -58.43 -34.61, -58.43 -34.59))', 4326)),
('Boedo', ST_GeomFromText('POLYGON((-58.42 -34.62, -58.40 -34.62, -58.40 -34.64, -58.42 -34.64, -58.42 -34.62))', 4326)),
('Caballito', ST_GeomFromText('POLYGON((-58.45 -34.60, -58.42 -34.60, -58.42 -34.62, -58.45 -34.62, -58.45 -34.60))', 4326)),
('Flores', ST_GeomFromText('POLYGON((-58.47 -34.61, -58.45 -34.61, -58.45 -34.63, -58.47 -34.63, -58.47 -34.61))', 4326)),
('Floresta', ST_GeomFromText('POLYGON((-58.50 -34.62, -58.47 -34.62, -58.47 -34.63, -58.50 -34.63, -58.50 -34.62))', 4326)),
('Villa Crespo', ST_GeomFromText('POLYGON((-58.46 -34.58, -58.43 -34.58, -58.43 -34.60, -58.46 -34.60, -58.46 -34.58))', 4326)),
('Villa Ortúzar', ST_GeomFromText('POLYGON((-58.48 -34.57, -58.46 -34.57, -58.46 -34.58, -58.48 -34.58, -58.48 -34.57))', 4326)),
('Colegiales', ST_GeomFromText('POLYGON((-58.47 -34.56, -58.45 -34.56, -58.45 -34.58, -58.47 -34.58, -58.47 -34.56))', 4326)),
('Chacarita', ST_GeomFromText('POLYGON((-58.47 -34.58, -58.45 -34.58, -58.45 -34.60, -58.47 -34.60, -58.47 -34.58))', 4326)),
('Villa Devoto', ST_GeomFromText('POLYGON((-58.54 -34.60, -58.50 -34.60, -58.50 -34.62, -58.54 -34.62, -58.54 -34.60))', 4326)),
('Villa del Parque', ST_GeomFromText('POLYGON((-58.51 -34.61, -58.48 -34.61, -58.48 -34.62, -58.51 -34.62, -58.51 -34.61))', 4326)),
('Villa Santa Rita', ST_GeomFromText('POLYGON((-58.50 -34.60, -58.47 -34.60, -58.47 -34.61, -58.50 -34.61, -58.50 -34.60))', 4326)),
('Villa Pueyrredón', ST_GeomFromText('POLYGON((-58.52 -34.58, -58.49 -34.58, -58.49 -34.60, -58.52 -34.60, -58.52 -34.58))', 4326)),
('Villa Urquiza', ST_GeomFromText('POLYGON((-58.50 -34.57, -58.48 -34.57, -58.48 -34.59, -58.50 -34.59, -58.50 -34.57))', 4326)),
('Saavedra', ST_GeomFromText('POLYGON((-58.50 -34.54, -58.48 -34.54, -58.48 -34.56, -58.50 -34.56, -58.50 -34.54))', 4326)),
('Coghlan', ST_GeomFromText('POLYGON((-58.49 -34.56, -58.47 -34.56, -58.47 -34.57, -58.49 -34.57, -58.49 -34.56))', 4326)),
('Núñez', ST_GeomFromText('POLYGON((-58.47 -34.54, -58.45 -34.54, -58.45 -34.56, -58.47 -34.56, -58.47 -34.54))', 4326)),

-- --------------------------------------------------------------------------
-- CABA: ZONAS OESTE Y SUROESTE
-- --------------------------------------------------------------------------
('Mataderos', ST_GeomFromText('POLYGON((-58.54 -34.65, -58.51 -34.65, -58.51 -34.67, -58.54 -34.67, -58.54 -34.65))', 4326)),
('Parque Avellaneda', ST_GeomFromText('POLYGON((-58.50 -34.64, -58.47 -34.64, -58.47 -34.66, -58.50 -34.66, -58.50 -34.64))', 4326)),
('Liniers', ST_GeomFromText('POLYGON((-58.54 -34.64, -58.52 -34.64, -58.52 -34.65, -58.54 -34.65, -58.54 -34.64))', 4326)),
('Versalles', ST_GeomFromText('POLYGON((-58.53 -34.61, -58.51 -34.61, -58.51 -34.63, -58.53 -34.63, -58.53 -34.61))', 4326)),
('Monte Castro', ST_GeomFromText('POLYGON((-58.51 -34.62, -58.49 -34.62, -58.49 -34.63, -58.51 -34.63, -58.51 -34.62))', 4326)),
('Vélez Sarsfield', ST_GeomFromText('POLYGON((-58.48 -34.62, -58.46 -34.62, -58.46 -34.63, -58.48 -34.63, -58.48 -34.62))', 4326)),
('Villa Real', ST_GeomFromText('POLYGON((-58.53 -34.60, -58.51 -34.60, -58.51 -34.61, -58.53 -34.61, -58.53 -34.60))', 4326)),
('Villa Luro', ST_GeomFromText('POLYGON((-58.52 -34.63, -58.50 -34.63, -58.50 -34.64, -58.52 -34.64, -58.52 -34.63))', 4326)),
('Parque Chacabuco', ST_GeomFromText('POLYGON((-58.45 -34.62, -58.43 -34.62, -58.43 -34.64, -58.45 -34.64, -58.45 -34.62))', 4326)),
('Agronomía', ST_GeomFromText('POLYGON((-58.49 -34.59, -58.47 -34.59, -58.47 -34.60, -58.49 -34.60, -58.49 -34.59))', 4326)),
('Parque Chas', ST_GeomFromText('POLYGON((-58.48 -34.58, -58.46 -34.58, -58.46 -34.59, -58.48 -34.59, -58.48 -34.58))', 4326)),
('Villa Lugano', ST_GeomFromText('POLYGON((-58.49 -34.67, -58.46 -34.67, -58.46 -34.70, -58.49 -34.70, -58.49 -34.67))', 4326)), -- Adicional para completar 41

-- --------------------------------------------------------------------------
-- GBA: ZONAS ESTRATÉGICAS (PARTIDOS PRINCIPALES)
-- --------------------------------------------------------------------------
('Vicente López (GBA Norte)', ST_GeomFromText('POLYGON((-58.52 -34.51, -58.46 -34.51, -58.46 -34.54, -58.52 -34.54, -58.52 -34.51))', 4326)),
('San Isidro (GBA Norte)', ST_GeomFromText('POLYGON((-58.56 -34.46, -58.49 -34.46, -58.49 -34.52, -58.56 -34.52, -58.56 -34.46))', 4326)),
('Avellaneda (GBA Sur)', ST_GeomFromText('POLYGON((-58.40 -34.64, -58.35 -34.64, -58.35 -34.70, -58.40 -34.70, -58.40 -34.64))', 4326)),
('Lanús (GBA Sur)', ST_GeomFromText('POLYGON((-58.46 -34.66, -58.40 -34.66, -58.40 -34.70, -58.46 -34.70, -58.46 -34.66))', 4326)),
('Lomas de Zamora (GBA Sur)', ST_GeomFromText('POLYGON((-58.50 -34.67, -58.45 -34.67, -58.45 -34.75, -58.50 -34.75, -58.50 -34.67))', 4326)),
('Tres de Febrero (GBA Oeste)', ST_GeomFromText('POLYGON((-58.59 -34.58, -58.52 -34.58, -58.52 -34.63, -58.59 -34.63, -58.59 -34.58))', 4326)),
('Morón (GBA Oeste)', ST_GeomFromText('POLYGON((-58.65 -34.62, -58.57 -34.62, -58.57 -34.69, -58.65 -34.69, -58.65 -34.62))', 4326))
) AS t(name, polygon)
ON CONFLICT (name) DO NOTHING;