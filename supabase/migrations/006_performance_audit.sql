-- 🎯 CONSULTA 1: Índices no utilizados (ELIMINAR CARGA INNECESARIA)
SELECT schemaname, tablename, indexname, idx_scan as usage_count
FROM pg_stat_user_indexes 
WHERE idx_scan = 0  -- Índices NUNCA usados
ORDER BY tablename;

-- 🎯 CONSULTA 2: Consultas más lentas (OPTIMIZAR INMEDIATO)
SELECT query, calls, mean_time, rows
FROM pg_stat_statements 
WHERE mean_time > 50  -- Más de 50ms
ORDER BY mean_time DESC 
LIMIT 10;

-- 🎯 CONSULTA 3: Tablas con más operaciones (ENFOQUE PRIORITARIO)
SELECT 
  schemaname,
  relname as table_name,
  seq_scan as full_scans,
  seq_tup_read as tuples_read,
  idx_scan as index_scans,
  n_tup_ins as inserts,
  n_tup_upd as updates,
  n_tup_del as deletes
FROM pg_stat_user_tables 
ORDER BY (seq_scan + idx_scan) DESC 
LIMIT 10;