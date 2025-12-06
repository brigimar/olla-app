Politicas Buckets Claude

-- =============================================================================
-- STORAGE POLICIES: Buckets para Producers (Logos, Banners, Productos)
-- =============================================================================
-- Versión corregida del script de DeepSeek
-- Cambios: 
-- - Renombrado "cocineros" → "producers" (consistencia con tu DB)
-- - Renombrado "platos" → "products" (consistencia con tu DB)
-- - Eliminados GRANT peligrosos que dan demasiados permisos
-- - Agregadas políticas de UPDATE y DELETE
-- - Mejorada seguridad con verificación de producer ownership

BEGIN;

-- =============================================================================
-- PASO 1: Crear buckets públicos
-- =============================================================================

-- Bucket para logos y banners de producers
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'producers',
  'producers',
  true,  -- Público para que cualquiera vea logos/banners
  5242880,  -- 5MB límite
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- Bucket para fotos de productos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'products',
  'products',
  true,  -- Público para que cualquiera vea productos
  3145728,  -- 3MB límite
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 3145728,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

RAISE NOTICE '✓ Buckets created/updated';

-- =============================================================================
-- PASO 2: Limpiar políticas existentes
-- =============================================================================

-- Eliminar políticas viejas si existen
DROP POLICY IF EXISTS "Cocineros can upload own logo" ON storage.objects;
DROP POLICY IF EXISTS "Public can view cocineros logos" ON storage.objects;
DROP POLICY IF EXISTS "Cocineros can upload dish photos" ON storage.objects;
DROP POLICY IF EXISTS "Public can view dish photos" ON storage.objects;

-- Eliminar políticas con nuevo naming si existen
DROP POLICY IF EXISTS "Producers can upload own files" ON storage.objects;
DROP POLICY IF EXISTS "Producers can update own files" ON storage.objects;
DROP POLICY IF EXISTS "Producers can delete own files" ON storage.objects;
DROP POLICY IF EXISTS "Public can view producer files" ON storage.objects;
DROP POLICY IF EXISTS "Producers can upload product photos" ON storage.objects;
DROP POLICY IF EXISTS "Producers can update product photos" ON storage.objects;
DROP POLICY IF EXISTS "Producers can delete product photos" ON storage.objects;
DROP POLICY IF EXISTS "Public can view product photos" ON storage.objects;

RAISE NOTICE '✓ Old policies cleaned';

-- =============================================================================
-- PASO 3: Políticas para bucket "producers" (logos y banners)
-- =============================================================================

-- INSERT: Producer puede subir archivos en su carpeta
CREATE POLICY "Producers can upload own files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'producers' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- SELECT: Todos pueden ver archivos del bucket producers (público)
CREATE POLICY "Public can view producer files"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'producers');

-- UPDATE: Producer puede actualizar archivos de su carpeta
CREATE POLICY "Producers can update own files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'producers'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'producers'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- DELETE: Producer puede eliminar archivos de su carpeta
CREATE POLICY "Producers can delete own files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'producers'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

RAISE NOTICE '✓ Policies for "producers" bucket created';

-- =============================================================================
-- PASO 4: Políticas para bucket "products" (fotos de productos)
-- =============================================================================

-- INSERT: Producer puede subir fotos de productos en su carpeta
CREATE POLICY "Producers can upload product photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'products'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- SELECT: Todos pueden ver fotos de productos (público)
CREATE POLICY "Public can view product photos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'products');

-- UPDATE: Producer puede actualizar fotos de sus productos
CREATE POLICY "Producers can update product photos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'products'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'products'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- DELETE: Producer puede eliminar fotos de sus productos
CREATE POLICY "Producers can delete product photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'products'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

RAISE NOTICE '✓ Policies for "products" bucket created';

-- =============================================================================
-- PASO 5: Verificación final
-- =============================================================================

DO $$
DECLARE
  bucket_count INTEGER;
  policy_count INTEGER;
BEGIN
  -- Contar buckets creados
  SELECT COUNT(*) INTO bucket_count
  FROM storage.buckets
  WHERE id IN ('producers', 'products');
  
  -- Contar políticas creadas
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'storage' 
    AND tablename = 'objects'
    AND policyname LIKE '%producer%' OR policyname LIKE '%product%';
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'STORAGE CONFIGURATION COMPLETED';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Buckets created: % (expected: 2)', bucket_count;
  RAISE NOTICE 'Policies created: % (expected: 8)', policy_count;
  RAISE NOTICE '';
  RAISE NOTICE 'Structure:';
  RAISE NOTICE '  producers/{producer_id}/logo.jpg';
  RAISE NOTICE '  producers/{producer_id}/banner.jpg';
  RAISE NOTICE '  products/{producer_id}/{product_id}.jpg';
  RAISE NOTICE '';
  RAISE NOTICE 'Security:';
  RAISE NOTICE '  ✓ Only producer can upload/edit/delete own files';
  RAISE NOTICE '  ✓ Public can view all files (buckets are public)';
  RAISE NOTICE '  ✓ File size limits: 5MB (producers), 3MB (products)';
  RAISE NOTICE '========================================';
END $$;

COMMIT;

-- =============================================================================
-- TESTING QUERIES (ejecutar después por separado)
-- =============================================================================
/*

-- 1. Ver buckets creados
SELECT 
  id,
  name,
  public,
  file_size_limit / 1048576 as "Max MB",
  allowed_mime_types
FROM storage.buckets
WHERE id IN ('producers', 'products');

-- 2. Ver todas las políticas de storage
SELECT 
  policyname,
  cmd as "Command",
  roles as "Roles"
FROM pg_policies
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND (policyname LIKE '%producer%' OR policyname LIKE '%product%')
ORDER BY policyname;

-- 3. Ver archivos actuales (si hay)
SELECT 
  bucket_id,
  name,
  (metadata->>'size')::bigint / 1024 as "Size KB",
  created_at
FROM storage.objects
WHERE bucket_id IN ('producers', 'products')
ORDER BY bucket_id, created_at DESC;

*/