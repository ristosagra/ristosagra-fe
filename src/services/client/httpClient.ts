const BASE_URL = import.meta.env.VITE_API_URL;

export const httpClient = {
  async get<T>(endpoint: string): Promise<T> {
    const res = await fetch(`${BASE_URL}${endpoint}`);
    if (!res.ok) throw new Error(`Errore: ${res.status}`);
    return res.json();
  },

  async post<T>(endpoint: string, body: unknown): Promise<T> {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Errore: ${res.status}`);
    return res.json();
  },

  async patch<T>(endpoint: string, body: unknown): Promise<T> {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Errore: ${res.status}`);
    return res.json();
  },
};
