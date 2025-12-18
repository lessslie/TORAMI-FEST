import { api } from './api';
import { Notification } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';

const getAuth = () => {
  try {
    const saved = localStorage.getItem('torami_auth');
    if (!saved) return { token: null, user: null };
    const parsed = JSON.parse(saved);
    return { token: parsed.token || null, user: parsed.user || null };
  } catch {
    return { token: null, user: null };
  }
};

const request = async (path: string, options: { method?: string; body?: any; token?: string | null } = {}) => {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (options.token) headers.Authorization = `Bearer ${options.token}`;
  const res = await fetch(`${API_BASE}${path}`, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  if (!res.ok) throw new Error((await res.text()) || res.statusText);
  return res.json();
};

// Config / Auth
export const getConfig = () => api.config.get();
export const updateConfig = (data: any) => {
  const { token } = getAuth();
  return api.config.update(token || '', data);
};
export const requestPasswordRecovery = (email: string) => api.recoverPassword(email);
export const resetPassword = (token: string, password: string) => api.resetPassword(token, password);

// Notifications
export const getNotifications = async (_userId: string): Promise<Notification[]> => {
  const { token } = getAuth();
  if (!token) return [];
  try {
    return await request('/notifications', { token });
  } catch {
    return [];
  }
};
export const markNotificationRead = async (id: string) => {
  const { token } = getAuth();
  if (!token) return;
  try {
    await request(`/notifications/${id}/read`, { method: 'PATCH', token });
  } catch {
    /* noop */
  }
};

// Events
export const getUpcomingEvents = () => api.events.getAll(true);
export const getEventById = (id: string) => api.events.getOne(id);
export const getEvents = () => api.events.getAll();
export const saveEvent = (data: any) => {
  const { token } = getAuth();
  if (data.id) {
    // Eliminar id del body antes de enviar al backend
    const { id, ...dataWithoutId } = data;
    return api.events.update(token || '', id, dataWithoutId);
  }
  return api.events.create(token || '', data);
};
export const deleteEvent = (id: string) => {
  const { token } = getAuth();
  return api.events.delete(token || '', id);
};

// Sponsors
export const getActiveSponsors = () => api.sponsors.getAll(true);
export const getSponsors = () => api.sponsors.getAll();
export const saveSponsor = (data: any) => {
  const { token } = getAuth();
  if (data.id) return api.sponsors.update(token || '', data.id, data);
  return api.sponsors.create(token || '', data);
};
export const deleteSponsor = (id: string) => {
  const { token } = getAuth();
  return api.sponsors.delete(token || '', id);
};

// Stands
export const getStandApplications = () => {
  const { token } = getAuth();
  return api.stands.getAll(token || '');
};
export const updateStandStatus = (id: string, status: 'Aprobada' | 'Rechazada') => {
  const { token } = getAuth();
  return api.stands.updateStatus(token || '', id, status);
};
export const addStandMessage = (standId: string, text: string, sender: 'ADMIN' | 'USER', imageUrl?: string) => {
  const { token } = getAuth();
  return api.stands.sendMessage(token || '', standId, { text, sender, imageUrl });
};
export const addStandApplication = (data: any) => {
  const { token } = getAuth();
  return api.stands.create(token || '', data);
};
export const getUserStands = (userId: string) => {
  const { token } = getAuth();
  return api.stands.getByUser(token || '', userId);
};

// Giveaways
export const getGiveaways = () => api.giveaways.getAll();
export const participateInGiveaway = (id: string) => {
  const { token } = getAuth();
  return api.giveaways.join(token || '', id);
};
export const getUserGiveaways = () => {
  const { token } = getAuth();
  return api.giveaways.getUserGiveaways(token || '');
};
export const saveGiveaway = (data: any) => {
  const { token } = getAuth();
  if (data.id) return api.giveaways.update(token || '', data.id, data);
  return api.giveaways.create(token || '', data);
};
export const deleteGiveaway = (id: string) => {
  const { token } = getAuth();
  return api.giveaways.delete(token || '', id);
};

// Cosplay
export const getCosplayRegistrations = () => {
  const { token } = getAuth();
  return api.cosplay.getAll(token || '');
};
export const getUserCosplays = (userId: string) => {
  const { token } = getAuth();
  return api.cosplay.getByUser(token || '', userId);
};
export const updateCosplayStatus = (id: string, status: 'Confirmado' | 'Rechazado') => {
  const { token } = getAuth();
  return api.cosplay.updateStatus(token || '', id, status);
};
export const addCosplayMessage = (cosplayId: string, text: string, sender: 'ADMIN' | 'USER', imageUrl?: string) => {
  const { token } = getAuth();
  return api.cosplay.sendMessage(token || '', cosplayId, { text, sender, imageUrl });
};
export const addCosplayRegistration = (data: any) => {
  const { token } = getAuth();
  return api.cosplay.create(token || '', data);
};

// Gallery
export const getGallery = (userId?: string, approved?: boolean) => api.gallery.getAll(userId, approved);
export const getUserGallery = () => api.gallery.getAll(undefined, undefined);
export const addGalleryItem = (data: any) => {
  const { token } = getAuth();
  return api.gallery.create(token || '', data);
};
export const approveGalleryItem = (id: string) => {
  const { token } = getAuth();
  return api.gallery.moderate(token || '', id, 'approved');
};
export const rejectGalleryItem = (id: string, feedback: string) => {
  const { token } = getAuth();
  return api.gallery.moderate(token || '', id, 'rejected', feedback);
};
export const deleteGalleryItem = (id: string) => {
  const { token } = getAuth();
  return api.gallery.delete(token || '', id);
};
export const updateGalleryItem = (item: any) => {
  const { token } = getAuth();
  if (item?.id && item.status) {
    return api.gallery.moderate(token || '', item.id, item.status, item.feedback);
  }
  return Promise.resolve(item);
};

// User profile
export const updateUserProfile = (data: any) => {
  const { token } = getAuth();
  return api.updateProfile(token || '', data);
};

// Stamps
export const validateStamp = (code: string) => {
  const { token } = getAuth();
  return api.stamps.validate(token || '', code);
};

// Stats
export const getStats = () => {
  const { token } = getAuth();
  if (!token) return Promise.resolve(null);
  return api.stats.getDashboard(token);
};
