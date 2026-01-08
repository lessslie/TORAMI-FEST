import { cacheManager } from '../src/services/cache';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';

type RequestOptions = {
  method?: string;
  body?: any;
  token?: string | null;
  useCache?: boolean;
  cacheTTL?: number;
};

async function request<T = any>(path: string, options: RequestOptions = {}): Promise<T> {
  // Check cache for GET requests
  if ((!options.method || options.method === 'GET') && options.useCache !== false) {
    const cacheKey = `${path}`;
    const cached = cacheManager.get<T>(cacheKey, options.cacheTTL);
    if (cached !== null) {
      return cached;
    }
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }

  const data = await res.json();

  // Cache GET responses
  if ((!options.method || options.method === 'GET') && options.useCache !== false) {
    const cacheKey = `${path}`;
    cacheManager.set(cacheKey, data);
  }

  return data;
}

// ==================== AUTH ====================
export const api = {
  // Authentication
  login: (email: string, password: string) =>
    request<{ user: any; token: string }>('/auth/login', { method: 'POST', body: { email, password } }),

  register: (data: any) =>
    request<{ user: any; token: string }>('/auth/register', { method: 'POST', body: data }),

  me: (token: string) => request<any>('/auth/me', { token }),

  updateProfile: (token: string, data: any) =>
    request<any>('/auth/profile', { method: 'PUT', body: data, token }),

  recoverPassword: (email: string) =>
    request<any>('/auth/recover', { method: 'POST', body: { email } }),

  resetPassword: (token: string, password: string) =>
    request<any>('/auth/reset', { method: 'POST', body: { token, password } }),

  // ==================== EVENTS ====================
  events: {
    getAll: (upcoming?: boolean, page: number = 1, limit: number = 10) => {
      const params = new URLSearchParams();
      params.append('page', String(page));
      params.append('limit', String(limit));
      if (upcoming !== undefined) params.append('upcoming', String(upcoming));
      return request<{ data: any[]; pagination: { total: number; page: number; limit: number; totalPages: number } }>(
        `/events?${params.toString()}`,
        { useCache: true }
      );
    },

    getOne: (id: string) =>
      request<any>(`/events/${id}`, { useCache: true }),

    create: (token: string, data: any) =>
      request<any>('/events', { method: 'POST', body: data, token, useCache: false }).then(result => {
        cacheManager.clear('/events');
        return result;
      }),

    update: (token: string, id: string, data: any) =>
      request<any>(`/events/${id}`, { method: 'PUT', body: data, token, useCache: false }).then(result => {
        cacheManager.clear('/events');
        return result;
      }),

    delete: (token: string, id: string) =>
      request<any>(`/events/${id}`, { method: 'DELETE', token, useCache: false }).then(result => {
        cacheManager.clear('/events');
        return result;
      }),
  },

  // ==================== STANDS ====================
  stands: {
    getAll: (token: string, page: number = 1, limit: number = 20, status?: string) => {
      const params = new URLSearchParams();
      params.append('page', String(page));
      params.append('limit', String(limit));
      if (status) params.append('status', status);
      return request<{ data: any[]; pagination: { total: number; page: number; limit: number; totalPages: number } }>(
        `/stands?${params.toString()}`,
        { token, useCache: true }
      );
    },

    getOne: (token: string, id: string) =>
      request<any>(`/stands/${id}`, { token, useCache: true }),

    getByUser: (token: string, userId: string) =>
      request<any[]>(`/stands/user/${userId}`, { token, useCache: true }),

    create: (token: string, data: any) =>
      request<any>('/stands', { method: 'POST', body: data, token, useCache: false }).then(result => {
        cacheManager.clear('/stands');
        return result;
      }),

    updateStatus: (token: string, id: string, status: string) =>
      request<any>(`/stands/${id}/status`, { method: 'PATCH', body: { status }, token, useCache: false }).then(result => {
        cacheManager.clear('/stands');
        return result;
      }),

    sendMessage: (token: string, id: string, message: any) =>
      request<any>(`/stands/${id}/messages`, { method: 'POST', body: message, token, useCache: false }).then(result => {
        cacheManager.clear('/stands');
        return result;
      }),
  },

  // ==================== COSPLAY ====================
  cosplay: {
    getAll: (token: string, page: number = 1, limit: number = 20, status?: string) => {
      const params = new URLSearchParams();
      params.append('page', String(page));
      params.append('limit', String(limit));
      if (status) params.append('status', status);
      return request<{ data: any[]; pagination: { total: number; page: number; limit: number; totalPages: number } }>(
        `/cosplay?${params.toString()}`,
        { token, useCache: true }
      );
    },

    getOne: (token: string, id: string) =>
      request<any>(`/cosplay/${id}`, { token, useCache: true }),

    getByUser: (token: string, userId: string) =>
      request<any[]>(`/cosplay/user/${userId}`, { token, useCache: true }),

    create: (token: string, data: any) =>
      request<any>('/cosplay', { method: 'POST', body: data, token, useCache: false }).then(result => {
        cacheManager.clear('/cosplay');
        return result;
      }),

    updateStatus: (token: string, id: string, status: string) =>
      request<any>(`/cosplay/${id}/status`, { method: 'PATCH', body: { status }, token, useCache: false }).then(result => {
        cacheManager.clear('/cosplay');
        return result;
      }),

    sendMessage: (token: string, id: string, message: any) =>
      request<any>(`/cosplay/${id}/messages`, { method: 'POST', body: message, token, useCache: false }).then(result => {
        cacheManager.clear('/cosplay');
        return result;
      }),

    getAvailableSlots: () =>
      request<{ available: number; limit: number; occupied: number }>('/cosplay/available-slots', { useCache: true, cacheTTL: 60000 }),

    addToWaitingList: (token: string, data: any) =>
      request<any>('/cosplay/waiting-list', { method: 'POST', body: data, token, useCache: false }).then(result => {
        cacheManager.clear('/cosplay');
        return result;
      }),
  },

  // ==================== COSPLAY GUEST ====================
  cosplayGuest: {
    getAll: () =>
      request<any[]>('/cosplay-guest'),

    getByUser: (token: string) =>
      request<any[]>('/cosplay-guest/user/me', { token }),

    create: (token: string, data: any) =>
      request<any>('/cosplay-guest', { method: 'POST', body: data, token }),

    withdraw: (token: string, id: string, withdrawalReason?: string) =>
      request<any>(`/cosplay-guest/${id}/withdraw`, { method: 'DELETE', body: { withdrawalReason }, token }),

    updateStatus: (token: string, id: string, status: string) =>
      request<any>(`/cosplay-guest/${id}/status`, { method: 'PATCH', body: { status }, token }),

    sendMessage: (token: string, id: string, message: any) =>
      request<any>(`/cosplay-guest/${id}/message`, { method: 'POST', body: { message }, token }),

    getAvailableSlots: () =>
      request<{ available: number; limit: number; occupied: number }>('/cosplay-guest/slots'),

    delete: (token: string, id: string) =>
      request<any>(`/cosplay-guest/${id}`, { method: 'DELETE', token }),
  },

  // ==================== GALLERY ====================
  gallery: {
    getAll: (page: number = 1, limit: number = 20, eventId?: string, status?: string, isOfficial?: boolean) => {
      const params = new URLSearchParams();
      params.append('page', String(page));
      params.append('limit', String(limit));
      if (eventId) params.append('eventId', eventId);
      if (status) params.append('status', status);
      if (isOfficial !== undefined) params.append('isOfficial', String(isOfficial));
      return request<{ data: any[]; pagination: { total: number; page: number; limit: number; totalPages: number } }>(
        `/gallery?${params.toString()}`,
        { useCache: true }
      );
    },

    getOne: (id: string) =>
      request<any>(`/gallery/${id}`, { useCache: true }),

    create: (token: string, data: any) =>
      request<any>('/gallery', { method: 'POST', body: data, token, useCache: false }).then(result => {
        cacheManager.clear('/gallery');
        return result;
      }),

    createOfficial: (token: string, data: any) =>
      request<any>('/gallery/official', { method: 'POST', body: data, token, useCache: false }).then(result => {
        cacheManager.clear('/gallery');
        return result;
      }),

    moderate: (token: string, id: string, status: string, feedback?: string) =>
      request<any>(`/gallery/${id}`, { method: 'PATCH', body: { status: status.toUpperCase(), feedback }, token, useCache: false }).then(result => {
        cacheManager.clear('/gallery');
        return result;
      }),

    update: (token: string, id: string, description: string) =>
      request<any>(`/gallery/${id}/update`, { method: 'PATCH', body: { description }, token, useCache: false }).then(result => {
        cacheManager.clear('/gallery');
        return result;
      }),

    delete: (token: string, id: string) =>
      request<any>(`/gallery/${id}`, { method: 'DELETE', token, useCache: false }).then(result => {
        cacheManager.clear('/gallery');
        return result;
      }),
  },

  // ==================== GIVEAWAYS ====================
  giveaways: {
    getAll: () =>
      request<any[]>('/giveaways'),

    getOne: (id: string) =>
      request<any>(`/giveaways/${id}`),

    create: (token: string, data: any) =>
      request<any>('/giveaways', { method: 'POST', body: data, token }),

    update: (token: string, id: string, data: any) =>
      request<any>(`/giveaways/${id}`, { method: 'PUT', body: data, token }),

    delete: (token: string, id: string) =>
      request<any>(`/giveaways/${id}`, { method: 'DELETE', token }),

    join: (token: string, id: string) =>
      request<any>(`/giveaways/${id}/join`, { method: 'POST', token }),

    getUserGiveaways: (token: string) =>
      request<any[]>('/giveaways/user/me', { token }),

    // Alias for compatibility
    getUser: (token: string) =>
      request<any[]>('/giveaways/user/me', { token }),
  },

  // ==================== SPONSORS ====================
  sponsors: {
    getAll: (activeOnly?: boolean) =>
      request<any[]>(`/sponsors${activeOnly ? '?activeOnly=true' : ''}`),

    getOne: (id: string) =>
      request<any>(`/sponsors/${id}`),

    create: (token: string, data: any) =>
      request<any>('/sponsors', { method: 'POST', body: data, token }),

    update: (token: string, id: string, data: any) =>
      request<any>(`/sponsors/${id}`, { method: 'PUT', body: data, token }),

    delete: (token: string, id: string) =>
      request<any>(`/sponsors/${id}`, { method: 'DELETE', token }),
  },

  // ==================== NOTIFICATIONS ====================
  notifications: {
    getAll: (token: string) =>
      request<any[]>('/notifications', { token }),

    getUnreadCount: (token: string) =>
      request<{ count: number }>('/notifications/unread-count', { token }),

    getOne: (token: string, id: string) =>
      request<any>(`/notifications/${id}`, { token }),

    create: (token: string, data: any) =>
      request<any>('/notifications', { method: 'POST', body: data, token }),

    markAsRead: (token: string, id: string) =>
      request<any>(`/notifications/${id}/read`, { method: 'PATCH', token }),

    markAllAsRead: (token: string) =>
      request<any>('/notifications/read-all', { method: 'PATCH', token }),

    delete: (token: string, id: string) =>
      request<any>(`/notifications/${id}`, { method: 'DELETE', token }),

    deleteAll: (token: string) =>
      request<any>('/notifications', { method: 'DELETE', token }),
  },

  // ==================== STAMPS ====================
  stamps: {
    validate: (token: string, code: string) =>
      request<any>('/stamps/validate', { method: 'POST', body: { code }, token }),

    getUserStamps: (token: string) =>
      request<any[]>('/stamps/user/me', { token }),

    getAll: (token: string) =>
      request<any[]>('/stamps', { token }),

    getStats: (token: string) =>
      request<any>('/stamps/stats', { token }),

    delete: (token: string, id: string) =>
      request<any>(`/stamps/${id}`, { method: 'DELETE', token }),
  },

  // ==================== STATS ====================
  stats: {
    getDashboard: (token: string) =>
      request<any>('/stats/dashboard', { token }),

    getUserStats: (token: string) =>
      request<any>('/stats/user/me', { token }),

    getEventStats: (token: string, eventId: string) =>
      request<any>(`/stats/event/${eventId}`, { token }),
  },

  // ==================== CONFIG ====================
  config: {
    get: () =>
      request<any>('/config', { useCache: true }),

    update: (token: string, data: any) =>
      request<any>('/config', { method: 'PUT', body: data, token, useCache: false }).then(result => {
        cacheManager.clear('config');
        return result;
      }),

    reset: (token: string) =>
      request<any>('/config/reset', { method: 'POST', token, useCache: false }).then(result => {
        cacheManager.clear('config');
        return result;
      }),
  },

  // ==================== UPLOADS ====================
  uploads: {
    uploadImage: async (token: string, file: File) => {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`${API_BASE}/uploads/image`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        throw new Error('Upload failed');
      }
      return res.json();
    },

    uploadAvatar: async (token: string, file: File) => {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`${API_BASE}/uploads/avatar`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        throw new Error('Upload failed');
      }
      return res.json();
    },
  },

  // ==================== USERS ====================
  users: {
    getAll: (token: string) =>
      request<any[]>('/users', { token }),

    getOne: (token: string, id: string) =>
      request<any>(`/users/${id}`, { token }),

    update: (token: string, id: string, data: any) =>
      request<any>(`/users/${id}`, { method: 'PUT', body: data, token }),

    delete: (token: string, id: string) =>
      request<any>(`/users/${id}`, { method: 'DELETE', token }),
  },

  // ==================== CHAT ====================
  chat: {
    sendMessage: (message: string, history: Array<{ role: 'user' | 'model'; text: string }>) =>
      request<{ reply: string }>('/chat', {
        method: 'POST',
        body: { message, history }
      }),
  },
};

export type ApiUser = Awaited<ReturnType<typeof api.me>>;

// Helper function for chat
export async function chatWithBot(
  message: string,
  history: Array<{ id?: string; role: 'user' | 'model'; text: string }>
): Promise<string> {
  // Remove 'id' field from history before sending to backend
  const cleanHistory = history.map(({ role, text }) => ({ role, text }));
  const response = await api.chat.sendMessage(message, cleanHistory);
  return response.reply;
}
