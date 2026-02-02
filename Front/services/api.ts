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

    // 1. Check if data is in cache
    const cached = cacheManager.get<T>(cacheKey, options.cacheTTL);
    if (cached !== null) {
      return cached;
    }

    // 2. Check if there's a pending request for this key
    const pending = cacheManager.getPendingRequest<T>(cacheKey);
    if (pending !== null) {
      return pending;
    }

    // 3. Create new request and register it as pending
    const requestPromise = executeRequest<T>(path, options);
    cacheManager.setPendingRequest(cacheKey, requestPromise);

    return requestPromise;
  }

  // Non-cacheable requests (POST, PUT, DELETE, etc.)
  return executeRequest<T>(path, options);
}

async function executeRequest<T = any>(path: string, options: RequestOptions = {}): Promise<T> {
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
      params.append('includeMessages', 'true'); // Include messages for admin chat
      if (status) params.append('status', status);
      return request<{ data: any[]; pagination: { total: number; page: number; limit: number; totalPages: number } }>(
        `/stands?${params.toString()}`,
        { token, useCache: false }
      );
    },

    getOne: (token: string, id: string) =>
      request<any>(`/stands/${id}`, { token, useCache: false }),

    getByUser: (token: string, userId: string) =>
      request<any[]>(`/stands/user/${userId}`, { token, useCache: false }),

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

    delete: (token: string, id: string) =>
      request<any>(`/stands/${id}`, { method: 'DELETE', token, useCache: false }).then(result => {
        cacheManager.clear('/stands');
        return result;
      }),

    getDownloadUrl: () =>
      `${API_BASE}/stands/download/pdf`,
  },

  // ==================== COSPLAY ====================
  cosplay: {
    getAll: (token: string, page: number = 1, limit: number = 20, status?: string) => {
      const params = new URLSearchParams();
      params.append('page', String(page));
      params.append('limit', String(limit));
      params.append('includeMessages', 'true'); // Include messages for admin chat
      if (status) params.append('status', status);
      return request<{ data: any[]; pagination: { total: number; page: number; limit: number; totalPages: number } }>(
        `/cosplay?${params.toString()}`,
        { token, useCache: false }
      );
    },

    getOne: (token: string, id: string) =>
      request<any>(`/cosplay/${id}`, { token, useCache: false }),

    getByUser: (token: string, userId: string) =>
      request<any[]>(`/cosplay/user/${userId}`, { token, useCache: false }),

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

    delete: (token: string, id: string) =>
      request<any>(`/cosplay/${id}`, { method: 'DELETE', token, useCache: false }).then(result => {
        cacheManager.clear('/cosplay');
        return result;
      }),

    getDownloadUrl: () =>
      `${API_BASE}/cosplay/download/pdf`,
  },

  // ==================== COSPLAY GUEST ====================
  cosplayGuest: {
    getAll: (token: string, page: number = 1, limit: number = 20, includeMessages?: boolean) => {
      const params = new URLSearchParams();
      params.append('page', String(page));
      params.append('limit', String(limit));
      if (includeMessages) params.append('includeMessages', 'true');
      return request<{ data: any[]; pagination: { total: number; page: number; limit: number; totalPages: number } }>(
        `/cosplay-guest?${params.toString()}`,
        { token, useCache: false }
      );
    },

    getByUser: (token: string, includeMessages?: boolean) => {
      const query = includeMessages ? '?includeMessages=true' : '';
      return request<any[]>(`/cosplay-guest/user/me${query}`, { token, useCache: false });
    },

    create: (token: string, data: any) =>
      request<any>('/cosplay-guest', { method: 'POST', body: data, token }),

    withdraw: (token: string, id: string, withdrawalReason?: string) =>
      request<any>(`/cosplay-guest/${id}/withdraw`, { method: 'DELETE', body: { withdrawalReason }, token }),

    updateStatus: (token: string, id: string, status: string) =>
      request<any>(`/cosplay-guest/${id}/status`, { method: 'PATCH', body: { status }, token }),

    sendMessage: (token: string, id: string, message: any) =>
      request<any>(`/cosplay-guest/${id}/message`, { method: 'POST', body: message, token, useCache: false }).then(result => {
        cacheManager.clear('/cosplay-guest');
        return result;
      }),

    getAvailableSlots: () =>
      request<{ available: number; limit: number; occupied: number }>('/cosplay-guest/slots'),

    delete: (token: string, id: string) =>
      request<any>(`/cosplay-guest/${id}`, { method: 'DELETE', token }),

    getOne: (token: string, id: string) =>
      request<any>(`/cosplay-guest/${id}`, { token, useCache: false }),

    getMessages: (token: string, id: string) =>
      request<{ messages: any[] }>(`/cosplay-guest/${id}/messages`, { token, useCache: false }),

    getDownloadUrl: () =>
      `${API_BASE}/cosplay-guest/download/pdf`,
  },

  // ==================== KARAOKE ====================
  karaoke: {
    getAll: (token: string, eventId?: string) => {
      const params = eventId ? `?eventId=${eventId}` : '';
      return request<any[]>(`/karaoke${params}`, { token, useCache: false });
    },

    getByUser: (token: string) =>
      request<any[]>('/karaoke/user/me', { token, useCache: false }),

    getAvailableSlots: (eventId: string) =>
      request<{ available: number; limit: number; occupied: number }>(`/karaoke/slots/${eventId}`),

    create: (token: string, data: any) =>
      request<any>('/karaoke', { method: 'POST', body: data, token }),

    updateStatus: (token: string, id: string, status: string) =>
      request<any>(`/karaoke/${id}/status`, { method: 'PATCH', body: { status }, token }),

    delete: (token: string, id: string) =>
      request<any>(`/karaoke/${id}`, { method: 'DELETE', token }),

    withdraw: (token: string, id: string) =>
      request<any>(`/karaoke/${id}/withdraw`, { method: 'DELETE', token }),

    getDownloadUrl: () =>
      `${API_BASE}/karaoke/download/pdf`,
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

    getByUser: (userId: string, page: number = 1, limit: number = 20) => {
      const params = new URLSearchParams();
      params.append('page', String(page));
      params.append('limit', String(limit));
      return request<{ data: any[]; pagination: { total: number; page: number; limit: number; totalPages: number } }>(
        `/gallery/user/${userId}?${params.toString()}`,
        { useCache: false }
      );
    },

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
    // Público: obtener sorteo activo actual
    getActive: () =>
      request<any>('/giveaways/active', { useCache: false }),

    // Admin: obtener todos los sorteos
    getAll: (token: string) =>
      request<any[]>('/giveaways', { token, useCache: false }),

    // Admin: obtener un sorteo
    getOne: (token: string, id: string) =>
      request<any>(`/giveaways/${id}`, { token, useCache: false }),

    // Admin: crear sorteo
    create: (token: string, data: any) =>
      request<any>('/giveaways', { method: 'POST', body: data, token }),

    // Admin: actualizar sorteo
    update: (token: string, id: string, data: any) =>
      request<any>(`/giveaways/${id}`, { method: 'PUT', body: data, token }),

    // Admin: eliminar sorteo
    delete: (token: string, id: string) =>
      request<any>(`/giveaways/${id}`, { method: 'DELETE', token }),

    // Público: inscribirse a un sorteo (formulario)
    join: (id: string, data: any, token?: string) =>
      request<{ message: string; success: boolean }>(`/giveaways/${id}/join`, {
        method: 'POST',
        body: data,
        token: token || undefined
      }),

    // Público: verificar si un DNI ya está inscripto
    checkDni: (id: string, dni: string) =>
      request<{ isRegistered: boolean }>(`/giveaways/${id}/check-dni?dni=${encodeURIComponent(dni)}`),

    // Admin: obtener participantes de un sorteo
    getParticipants: (token: string, id: string) =>
      request<any[]>(`/giveaways/${id}/participants`, { token, useCache: false }),

    // Admin: descargar participantes
    getDownloadUrl: (id: string) =>
      `${API_BASE}/giveaways/${id}/participants/download`,

    // Usuario logueado: mis sorteos
    getUserGiveaways: (token: string) =>
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
    get: (includeImages?: boolean) => {
      const query = includeImages ? '?includeImages=true' : '';
      // No usar cache para config - siempre obtener datos frescos
      return request<any>(`/config${query}`, { useCache: false });
    },

    update: (token: string, data: any) =>
      request<any>('/config', { method: 'PUT', body: data, token, useCache: false }).then(result => {
        cacheManager.clear('/config');
        return result;
      }),

    reset: (token: string) =>
      request<any>('/config/reset', { method: 'POST', token, useCache: false }).then(result => {
        cacheManager.clear('/config');
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
