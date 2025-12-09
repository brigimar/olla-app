// ─── ERRORES PERSONALIZADOS ───────────────────────────────────────────────────

export class NetworkError extends Error {
  constructor(message: string = 'Error de red. Verifica tu conexión.') {
    super(message);
    this.name = 'NetworkError';
  }
}

export class NotFoundError extends Error {
  constructor(message: string = 'Recurso no encontrado') {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class SupabaseError extends Error {
  code?: string;
  constructor(message: string, code?: string) {
    super(message);
    this.name = 'SupabaseError';
    this.code = code;
  }
}

// ─── HANDLER DE ERRORES ───────────────────────────────────────────────────────

export function handleSupabaseError(error: unknown): Error {
  if (typeof error === 'object' && error !== null) {
    const err = error as { code?: string; message?: string };

    // Not found (ejemplo: select .single() sin resultados)
    if (err.code === 'PGRST116') {
      return new NotFoundError('Plato no encontrado');
    }

    // Error de red
    if (err.code === 'NETWORK_ERROR' || err.message?.toLowerCase().includes('network')) {
      return new NetworkError();
    }

    // Error genérico de Supabase
    return new SupabaseError(err.message || 'Error al cargar los datos', err.code);
  }

  // Error desconocido
  return new Error('Error desconocido');
}




