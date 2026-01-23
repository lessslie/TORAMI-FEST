import { api } from './api';
import { Notification } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';

export const getAuth = () => {
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

// Upload images to Cloudinary
export const uploadImageToCloudinary = async (file: File): Promise<string> => {
  const { token } = getAuth();
  if (!token) throw new Error('Debes iniciar sesión para subir imágenes');

  const result = await api.uploads.uploadImage(token, file);
  return result.secure_url;
};

// Config / Auth
export const getConfig = (includeImages?: boolean) => api.config.get(includeImages);
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
export const getUpcomingEvents = async () => {
  const response = await api.events.getAll(true, 1, 100);
  return response.data;
};
export const getEventById = (id: string) => api.events.getOne(id);
export const getEvents = async () => {
  const response = await api.events.getAll(undefined, 1, 100);
  return response.data;
};
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
export const getStandApplications = async (page: number = 1, limit: number = 10) => {
  const { token } = getAuth();
  const response = await api.stands.getAll(token || '', page, limit);
  return response;
};
export const updateStandStatus = (id: string, status: 'Aprobada' | 'Rechazada') => {
  const { token } = getAuth();
  // Convert to uppercase for backend enum
  const statusUpperCase = status.toUpperCase() as 'APROBADA' | 'RECHAZADA';
  return api.stands.updateStatus(token || '', id, statusUpperCase);
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
export const deleteStand = (id: string) => {
  const { token } = getAuth();
  return api.stands.delete(token || '', id);
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
export const getCosplayRegistrations = async (page: number = 1, limit: number = 10) => {
  const { token } = getAuth();
  const response = await api.cosplay.getAll(token || '', page, limit);
  return response;
};
export const getUserCosplays = (userId: string) => {
  const { token } = getAuth();
  return api.cosplay.getByUser(token || '', userId);
};
export const updateCosplayStatus = (id: string, status: 'Confirmado' | 'Rechazado') => {
  const { token } = getAuth();
  // Convert to uppercase for backend enum
  const statusUpperCase = status.toUpperCase() as 'CONFIRMADO' | 'RECHAZADO';
  return api.cosplay.updateStatus(token || '', id, statusUpperCase);
};
export const addCosplayMessage = (cosplayId: string, text: string, sender: 'ADMIN' | 'USER', imageUrl?: string) => {
  const { token } = getAuth();
  return api.cosplay.sendMessage(token || '', cosplayId, { text, sender, imageUrl });
};
export const addCosplayRegistration = (data: any) => {
  const { token } = getAuth();
  return api.cosplay.create(token || '', data);
};

export const getCosplayAvailableSlots = () => api.cosplay.getAvailableSlots();

export const addToWaitingList = (data: any) => {
  const { token } = getAuth();
  return api.cosplay.addToWaitingList(token || '', data);
};
export const deleteCosplayRegistration = (id: string) => {
  const { token } = getAuth();
  return api.cosplay.delete(token || '', id);
};

// Cosplay Guest
export const getCosplayGuests = (page: number = 1, limit: number = 10) => {
  const { token } = getAuth();
  return api.cosplayGuest.getAll(token || '', page, limit);
};
export const getUserCosplayGuests = () => {
  const { token } = getAuth();
  return api.cosplayGuest.getByUser(token || '', false);
};
export const addCosplayGuestRegistration = (data: any) => {
  const { token } = getAuth();
  return api.cosplayGuest.create(token || '', data);
};
export const withdrawCosplayGuest = (id: string, withdrawalReason?: string) => {
  const { token } = getAuth();
  return api.cosplayGuest.withdraw(token || '', id, withdrawalReason);
};
export const updateCosplayGuestStatus = (id: string, status: 'Confirmado' | 'Rechazado') => {
  const { token } = getAuth();
  // Convert to uppercase for backend enum
  const statusUpperCase = status.toUpperCase() as 'CONFIRMADO' | 'RECHAZADO';
  return api.cosplayGuest.updateStatus(token || '', id, statusUpperCase);
};
export const addCosplayGuestMessage = (guestId: string, text: string, sender: 'ADMIN' | 'USER', imageUrl?: string) => {
  const { token } = getAuth();
  return api.cosplayGuest.sendMessage(token || '', guestId, { text, sender, imageUrl });
};
export const getCosplayGuestAvailableSlots = () => api.cosplayGuest.getAvailableSlots();
export const deleteCosplayGuest = (id: string) => {
  const { token } = getAuth();
  return api.cosplayGuest.delete(token || '', id);
};

export const getCosplayGuestById = (id: string) => {
  const { token } = getAuth();
  return api.cosplayGuest.getOne(token || '', id);
};

export const getCosplayGuestMessages = (id: string) => {
  const { token } = getAuth();
  return api.cosplayGuest.getMessages(token || '', id);
};

// Karaoke
export const getKaraokeRegistrations = (eventId?: string) => {
  const { token } = getAuth();
  return api.karaoke.getAll(token || '', eventId);
};
export const getUserKaraoke = () => {
  const { token } = getAuth();
  return api.karaoke.getByUser(token || '');
};
export const getKaraokeAvailableSlots = (eventId: string) =>
  api.karaoke.getAvailableSlots(eventId);
export const addKaraokeRegistration = (data: any) => {
  const { token } = getAuth();
  return api.karaoke.create(token || '', data);
};
export const updateKaraokeStatus = (id: string, status: 'APROBADO' | 'RECHAZADO' | 'PENDIENTE') => {
  const { token } = getAuth();
  return api.karaoke.updateStatus(token || '', id, status);
};
export const deleteKaraoke = (id: string) => {
  const { token } = getAuth();
  return api.karaoke.delete(token || '', id);
};
export const withdrawKaraoke = (id: string) => {
  const { token } = getAuth();
  return api.karaoke.withdraw(token || '', id);
};

// Gallery
export const getGallery = async (page: number = 1, limit: number = 100, eventId?: string, status?: string) => {
  const response = await api.gallery.getAll(page, limit, eventId, status, undefined);
  return response.data;
};
export const getOfficialGallery = async (page: number = 1, limit: number = 100) => {
  const response = await api.gallery.getAll(page, limit, undefined, 'APPROVED', true);
  return response.data;
};
export const getCommunityGallery = (page: number = 1, limit: number = 20) =>
  api.gallery.getAll(page, limit, undefined, 'APPROVED', false);
export const getUserGallery = (userId: string, page: number = 1, limit: number = 20) =>
  api.gallery.getByUser(userId, page, limit);
export const addGalleryItem = (data: any) => {
  const { token } = getAuth();
  return api.gallery.create(token || '', data);
};
export const addOfficialGalleryItem = (data: any) => {
  const { token } = getAuth();
  return api.gallery.createOfficial(token || '', data);
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
export const updateUserGalleryItem = (id: string, description: string) => {
  const { token } = getAuth();
  return api.gallery.update(token || '', id, description);
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

// Donations
export const getDonationStats = () => request('/donations/stats');
export const createDonation = (data: { donorName?: string; donorEmail: string; amount: number; isAnonymous?: boolean; message?: string }) =>
  request('/donations', { method: 'POST', body: data });

// Notifications
export const getUnreadNotificationCount = () => {
  const { token } = getAuth();
  return request('/notifications/unread-count', { token });
};
export const markNotificationAsRead = (id: string) => {
  const { token } = getAuth();
  return request(`/notifications/${id}/read`, { method: 'PATCH', token });
};
export const markAllNotificationsAsRead = () => {
  const { token } = getAuth();
  return request('/notifications/read-all', { method: 'PATCH', token });
};

// Admin - User Management
export const getAllUsers = (page: number = 1, limit: number = 10) => {
  const { token } = getAuth();
  return request(`/users?page=${page}&limit=${limit}`, { token });
};

export const updateUser = (userId: string, data: Partial<{ name: string; email: string; whatsapp: string; phone: string; role: string; entryAuthorized: boolean }>) => {
  const { token } = getAuth();
  return request(`/users/${userId}`, { method: 'PUT', body: data, token });
};

export const deleteUser = (userId: string) => {
  const { token } = getAuth();
  return request(`/users/${userId}`, { method: 'DELETE', token });
};
