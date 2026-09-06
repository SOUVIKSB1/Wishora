const RAW_API_BASE = ((import.meta as any).env?.VITE_API_URL as string) || '';
const API_BASE = RAW_API_BASE.replace(/\/+$/, '');

// Instant Warm-up / Wake-up Render Backend silently on page load
let isWakingUp = false;
export function warmUpBackend() {
  if (isWakingUp || !API_BASE) return;
  isWakingUp = true;
  // Non-blocking fire-and-forget health ping
  fetch(`${API_BASE}/health`, { method: 'GET', keepalive: true }).catch(() => {});
}

// Trigger warmup immediately when module loads
warmUpBackend();

const TOKEN_KEY = 'wishora_auth_token';

export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearAuthToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    ...(options?.headers as Record<string, string> || {}),
  };
  if (options?.body || options?.method === 'POST' || options?.method === 'PUT') {
    headers['Content-Type'] = 'application/json';
  }

  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = API_BASE ? `${API_BASE}/api/v1${endpoint}` : `/api/v1${endpoint}`;

  const res = await fetch(url, {
    ...options,
    body: options?.body ? options.body : (options?.method === 'POST' || options?.method === 'PUT' ? JSON.stringify({}) : undefined),
    headers,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Request failed with status ${res.status}`);
  }

  return res.json();
}

export const api = {
  // Auth
  register: async (data: { email: string; password?: string; display_name: string; user_dob?: string; gender?: string; avatar_url?: string }) => {
    const res = await fetchApi<{ user: any; token: string }>('/auth/register', { method: 'POST', body: JSON.stringify(data) });
    if (res.token) setAuthToken(res.token);
    return res;
  },
  login: async (email: string, password: string) => {
    const res = await fetchApi<{ user: any; token: string }>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
    if (res.token) setAuthToken(res.token);
    return res;
  },
  googleLogin: async (data: { email: string; google_id?: string; display_name?: string; avatar_url?: string; user_dob?: string; gender?: string }) => {
    const res = await fetchApi<{ user: any; token: string }>('/auth/google', { method: 'POST', body: JSON.stringify(data) });
    if (res.token) setAuthToken(res.token);
    return res;
  },
  logout: () => {
    clearAuthToken();
  },
  getMe: () => fetchApi<{ user: any; stats: any }>('/auth/me'),
  updateProfile: (data: any) => fetchApi<{ user: any; stats: any }>('/auth/me', { method: 'PUT', body: JSON.stringify(data) }),

  // Contacts
  getContacts: () => fetchApi<{ contacts: any[]; total: number }>('/contacts'),
  createContact: (data: any) => fetchApi<{ contact: any }>('/contacts', { method: 'POST', body: JSON.stringify(data) }),
  updateContact: (id: string, data: any) => fetchApi<{ contact: any }>(`/contacts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteContact: (id: string) => fetchApi<{ success: boolean; id: string }>(`/contacts/${id}`, { method: 'DELETE' }),
  importContacts: (data: { rows?: any[]; csvContent?: string; conflictStrategy?: string }) => 
    fetchApi<{ success: boolean; imported: number; updated: number; skipped: number }>('/contacts/import', { method: 'POST', body: JSON.stringify(data) }),

  // Wishes
  getWishes: (params?: { folder_id?: string; status?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return fetchApi<{ wishes: any[]; total: number }>(`/wishes${query ? `?${query}` : ''}`);
  },
  getWish: (id: string) => fetchApi<{ wish: any; photos: any[]; opens: any[]; reactions: any[] }>(`/wishes/${id}`),
  createWish: (data: any) => fetchApi<{ wish: any; photos: any[] }>('/wishes', { method: 'POST', body: JSON.stringify(data) }),
  updateWish: (id: string, data: any) => fetchApi<{ wish: any; photos: any[] }>(`/wishes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteWish: (id: string) => fetchApi<{ success: boolean; id: string }>(`/wishes/${id}`, { method: 'DELETE' }),
  generateWishLink: (id: string) => fetchApi<{ success: boolean; wish: any; slug: string; share_url: string }>(`/wishes/${id}/generate`, { method: 'POST' }),

  // AI Suggestion
  suggestWish: (data: { name: string; age?: number; gender?: string; relationship?: string; language?: string; tone?: string }) =>
    fetchApi<{ suggestions: Array<{ tone: string; message: string; emoji_suggestion: string }> }>('/ai/suggest-wish', { method: 'POST', body: JSON.stringify(data) }),

  // Music
  getMusic: () => fetchApi<{ tracks: any[] }>('/music'),
  uploadCustomMusic: (data: any) => fetchApi<{ track: any }>('/music/upload', { method: 'POST', body: JSON.stringify(data) }),

  // Folders
  getFolders: () => fetchApi<{ folders: any[] }>('/folders'),
  createFolder: (data: { name: string; color?: string }) => fetchApi<{ folder: any }>('/folders', { method: 'POST', body: JSON.stringify(data) }),
  updateFolder: (id: string, data: any) => fetchApi<{ folder: any }>(`/folders/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteFolder: (id: string) => fetchApi<{ success: boolean }>(`/folders/${id}`, { method: 'DELETE' }),

  // Public Experience
  getPublicWish: (slug: string) => fetchApi<any>(`/w/${slug}`),
  logOpen: (slug: string) => fetchApi<any>(`/w/${slug}/open`, { method: 'POST' }),
  submitReaction: (slug: string, data: { media_url?: string; type?: string; duration?: number; message_text?: string }) =>
    fetchApi<any>(`/w/${slug}/react`, { method: 'POST', body: JSON.stringify(data) }),
};
