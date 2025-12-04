export async function api(path: string, options: RequestInit = {}) {
  const res = await fetch(path, options); // ✅ usamos path y options
  return res.json();
}
