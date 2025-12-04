// ─── ERRORES PERSONALIZADOS ───────────────────────────────────────────────────

export class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NetworkError';
  }
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

// ─── HANDLER DE ERRORES ───────────────────────────────────────────────────────

export function handleSupabaseError(error: unknown): Error {
  if (typeof error === 'object' && error !== null) {
    const err = error as { code?: string; message?: string };

    if (err.code === 'PGRST116') {
      return new NotFoundError('Plato no encontrado');
    }
    if (err.code === 'NETWORK_ERROR' || err.message?.includes('network')) {
      return new NetworkError('Error de red. Verifica tu conexión.');
    }
    return new Error(err.message || 'Error al cargar los datos');
  }

  return new Error('Error desconocido');
}
