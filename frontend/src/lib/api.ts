export async function api(path: string, options: RequestInit = {}) {
  const res = await fetch(\\\\, {
    ...options,
    headers: { 'Content-Type': 'application/json' }
  });
  return res.json();
}

