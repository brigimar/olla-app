export async function api(path: string, options: RequestInit = {}) {
  const res = await fetch('/api/dishes', {
    method: 'GET',
  });
  return res.json();
}
