const BASE_URL = import.meta.env.VITE_API_URL;
const getToken = () => localStorage.getItem("auth_token");

const authHeaders = () => ({
  "Content-Type": "application/json",
  ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
});

const handleResponse = async <T>(res: Response): Promise<T> => {
  if (res.status === 401) {
    localStorage.removeItem("auth_token");
    globalThis.location.href = "/cassa";
  }
  if (!res.ok) throw new Error(`Errore: ${res.status}`);
  return res.json();
};

export const httpClient = {
  async get<T>(endpoint: string): Promise<T> {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      headers: authHeaders(),
    });
    return handleResponse<T>(res);
  },

  async post<T>(endpoint: string, body: unknown): Promise<T> {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(body),
    });
    return handleResponse<T>(res);
  },

  async patch<T>(endpoint: string, body: unknown): Promise<T> {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify(body),
    });
    return handleResponse<T>(res);
  },
};
