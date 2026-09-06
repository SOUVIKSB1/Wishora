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
const CACHED_USER_KEY = 'wishora_cached_user';

export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearAuthToken() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(CACHED_USER_KEY);
}

export function getCachedUser(): any | null {
  try {
    const raw = localStorage.getItem(CACHED_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setCachedUser(user: any) {
  if (user) {
    localStorage.setItem(CACHED_USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(CACHED_USER_KEY);
  }
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
    if (res.user) setCachedUser(res.user);
    return res;
  },
  login: async (email: string, password: string) => {
    const res = await fetchApi<{ user: any; token: string }>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
    if (res.token) setAuthToken(res.token);
    if (res.user) setCachedUser(res.user);
    return res;
  },
  googleLogin: async (data: { email: string; google_id?: string; display_name?: string; avatar_url?: string; user_dob?: string; gender?: string }) => {
    const res = await fetchApi<{ user: any; token: string; is_new_user?: boolean }>('/auth/google', { method: 'POST', body: JSON.stringify(data) });
    if (res.token) setAuthToken(res.token);
    if (res.user) setCachedUser(res.user);
    return res;
  },
  googleComplete: async (data: { email: string; google_id?: string; display_name: string; avatar_url?: string; user_dob: string; gender: string }) => {
    const res = await fetchApi<{ user: any; token: string }>('/auth/google-complete', { method: 'POST', body: JSON.stringify(data) });
    if (res.token) setAuthToken(res.token);
    if (res.user) setCachedUser(res.user);
    return res;
  },
  logout: () => {
    clearAuthToken();
  },
  getMe: async () => {
    const res = await fetchApi<{ user: any; stats: any }>('/auth/me');
    if (res.user) setCachedUser(res.user);
    return res;
  },
  updateProfile: async (data: any) => {
    const res = await fetchApi<{ user: any; stats: any }>('/auth/me', { method: 'PUT', body: JSON.stringify(data) });
    if (res.user) setCachedUser(res.user);
    return res;
  },

  // Contacts
  getContacts: () => fetchApi<{ contacts: any[]; total: number }>('/contacts'),
  createContact: (data: any) => fetchApi<{ contact: any }>('/contacts', { method: 'POST', body: JSON.stringify(data) }),
  updateContact: (id: string, data: any) => fetchApi<{ contact: any }>(`/contacts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteContact: (id: string) => fetchApi<{ success: boolean; id: string }>(`/contacts/${id}`, { method: 'DELETE' }),
  bulkDeleteContacts: (ids: string[]) => 
    fetchApi<{ success: boolean; deleted: number; ids: string[] }>('/contacts/bulk-delete', { method: 'POST', body: JSON.stringify({ ids }) }),
  deleteAllContacts: () => 
    fetchApi<{ success: boolean; message: string }>('/contacts/all', { method: 'DELETE' }),
  importContacts: (data: { rows?: any[]; csvContent?: string; conflictStrategy?: string }) => 
    fetchApi<{ success: boolean; imported: number; updated: number; skipped: number }>('/contacts/import', { method: 'POST', body: JSON.stringify(data) }),
  previewContactsCsv: (csvContent: string) =>
    fetchApi<{ rows: any[]; errors: any[]; total_parsed: number }>('/contacts/csv-preview', { method: 'POST', body: JSON.stringify({ csvContent }) }),

  // Wishes
  getWishes: (params?: { folder_id?: string; status?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return fetchApi<{ wishes: any[]; total: number }>(`/wishes${query ? `?${query}` : ''}`);
  },
  getWish: (id: string) => fetchApi<{ wish: any; photos: any[]; opens: any[]; reactions: any[]; versions?: any[] }>(`/wishes/${id}`),
  createWish: (data: any) => fetchApi<{ wish: any; photos: any[] }>('/wishes', { method: 'POST', body: JSON.stringify(data) }),
  updateWish: (id: string, data: any) => fetchApi<{ wish: any; photos: any[] }>(`/wishes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteWish: (id: string) => fetchApi<{ success: boolean; id: string }>(`/wishes/${id}`, { method: 'DELETE' }),
  generateWishLink: (id: string) => fetchApi<{ success: boolean; wish: any; slug: string; share_url: string }>(`/wishes/${id}/generate`, { method: 'POST' }),
  getWishVersions: (id: string) => fetchApi<{ versions: any[] }>(`/wishes/${id}/versions`),
  revertWishVersion: (id: string, versionId: string) => fetchApi<{ success: boolean; wish: any; photos: any[] }>(`/wishes/${id}/revert/${versionId}`, { method: 'POST' }),

  // AI Suggestion & Captions
  suggestWish: (data: { name: string; age?: number; gender?: string; relationship?: string; language?: string; tone?: string }) =>
    fetchApi<{ suggestions: Array<{ tone: string; message: string; emoji_suggestion: string }> }>('/ai/suggest-wish', { method: 'POST', body: JSON.stringify(data) }),
  generateCaptions: (data: { name: string; relationship?: string; age?: number; gender?: string; theme?: string; count: number }) =>
    fetchApi<{ captions: string[] }>('/ai/generate-captions', { method: 'POST', body: JSON.stringify(data) }),

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
  logOpen: (slug: string) => fetchApi<{ success: boolean }>(`/w/${slug}/open`, { method: 'POST' }),
  logWishOpen: (slug: string) => fetchApi<{ success: boolean }>(`/w/${slug}/open`, { method: 'POST' }),
  submitReaction: (slug: string, data: { type: string; media_url?: string; message_text?: string; duration?: number }) => 
    fetchApi<{ success: boolean; reactionId: string }>(`/w/${slug}/react`, { method: 'POST', body: JSON.stringify(data) }),



  // Templates
  getTemplates: () => fetchApi<{ templates: any[] }>('/templates'),

  // Notifications
  getNotifications: () => fetchApi<{ notifications: any[] }>('/auth/notifications'),
  markNotificationRead: (id: string) => fetchApi<{ success: boolean }>(`/auth/notifications/${id}/read`, { method: 'POST' }),

  // Admin Controls
  getAdminStats: () => fetchApi<{ stats: any }>('/admin/stats'),
  getAdminUsers: () => fetchApi<{ users: any[]; total: number }>('/admin/users'),
  updateUserPlan: (id: string, plan: string) => fetchApi<{ success: boolean; user: any }>(`/admin/users/${id}/plan`, { method: 'PUT', body: JSON.stringify({ plan }) }),
  updateUserRole: (id: string, role: string) => fetchApi<{ success: boolean; user: any }>(`/admin/users/${id}/role`, { method: 'PUT', body: JSON.stringify({ role }) }),
  deleteUser: (id: string) => fetchApi<{ success: boolean; message: string }>(`/admin/users/${id}`, { method: 'DELETE' }),

  getAdminMusic: () => fetchApi<{ tracks: any[] }>('/admin/music'),
  addAdminMusic: (data: { title: string; artist?: string; genre?: string; mood_tags?: string[]; storage_url: string; duration?: number; is_premium?: boolean }) =>
    fetchApi<{ success: boolean; track: any }>('/admin/music', { method: 'POST', body: JSON.stringify(data) }),
  deleteAdminMusic: (id: string) => fetchApi<{ success: boolean; id: string }>(`/admin/music/${id}`, { method: 'DELETE' }),

  getAdminTemplates: () => fetchApi<{ templates: any[] }>('/admin/templates'),
  createAdminTemplate: (data: { title: string; content: string; category?: string; tone?: string; language?: string; is_premium?: boolean }) =>
    fetchApi<{ success: boolean; template: any }>('/admin/templates', { method: 'POST', body: JSON.stringify(data) }),
  updateAdminTemplate: (id: string, data: any) =>
    fetchApi<{ success: boolean; template: any }>(`/admin/templates/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteAdminTemplate: (id: string) => fetchApi<{ success: boolean; id: string }>(`/admin/templates/${id}`, { method: 'DELETE' }),

  getAdminNotifications: () => fetchApi<{ notifications: any[] }>('/admin/notifications'),
  sendAdminNotification: (data: { title: string; message: string; user_id?: string | null; type?: string }) =>
    fetchApi<{ success: boolean; notification: any; recipient_type: string }>('/admin/notifications', { method: 'POST', body: JSON.stringify(data) }),
  deleteAdminNotification: (id: string) => fetchApi<{ success: boolean; id: string }>(`/admin/notifications/${id}`, { method: 'DELETE' }),
};
