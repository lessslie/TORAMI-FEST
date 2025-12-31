
export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  USER = 'USER',
  EMPRENDEDOR = 'EMPRENDEDOR',
  GUEST = 'GUEST'
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  email: string;
  avatar?: string; // New avatar field
  entryAuthorized?: boolean; // Control de acceso a evento
  ticketType?: 'General' | 'VIP' | 'Cosplayer'; // Ticket level
  stamps?: string[]; // Array of collected stamp IDs
  age?: number;
  phone?: string;
  whatsapp?: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  date: string;
  link?: string;
}

export interface TransportInfo {
  bus?: string;     // e.g. "111, 29, 64"
  subway?: string;  // e.g. "Línea D - Estación Carranza"
  train?: string;   // e.g. "Línea Mitre"
}

export interface Event {
  id: string;
  title: string;
  date: string; // ISO string
  time: string;
  location: string;
  description: string;
  isPast: boolean;
  tags: string[];
  isFeatured: boolean;
  rainCheck: boolean; // seSuspendePorLluvia
  images: string[]; // Array of image URLs
  highlights?: string[]; // For past events
  transport?: TransportInfo; // New field for transport
  isFree: boolean; // Si la entrada es gratuita
  ticketPrice?: number; // Precio de la entrada (si no es gratis)
  ticketLink?: string; // Link para comprar tickets
}

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'ADMIN' | 'USER';
  timestamp: string;
  imageUrl?: string;
}

export interface StandApplication {
  id: string;
  userId: string; // Owner ID
  brandName: string;
  type: 'Comida' | 'Bebida' | 'Postres' | 'Merch' | 'Ilustraciones' | 'Cosplay' | '3D' | 'Videojuegos' | 'Otros';
  contactName: string;
  email: string;
  phone: string;
  socials: string;
  description: string;
  needs: string;
  images: string[]; // Fotos de la mercadería
  status: 'Pendiente' | 'Aprobada' | 'Rechazada';
  eventId?: string;
  event?: Event; // Populated event data
  messages: ChatMessage[];
}

export interface CosplayRegistration {
  id: string;
  userId: string; // Owner ID
  participantName: string; // Nombre real
  nickname: string; // Nombre artístico
  whatsapp: string;
  characterName: string;
  seriesName: string;
  category: 'General' | 'Performance' | 'Chibi' | 'Grupal';
  referenceImage?: string; // URL o base64
  audioLink?: string; // Para performance
  status: 'Inscripto' | 'Confirmado' | 'Rechazado' | 'Lista de Espera';
  eventId?: string;
  event?: Event; // Populated event data
  messages: ChatMessage[];
  notifyEmail?: string; // Email para notificar si se libera cupo (opcional)
}

export interface Sponsor {
  id: string;
  name: string;
  logoUrl: string;
  category: 'Principal' | 'Colaborador' | 'Media Partner';
  link: string;
  active: boolean;
}

export interface Giveaway {
  id: string;
  title: string;
  description: string;
  prize: string;
  startDate: string;
  endDate: string;
  status: 'Activo' | 'Finalizado';
  winner?: string; // Name of winner
  participantIds: string[]; // IDs of users participating
  eventId?: string;
  event?: Event; // Populated event data
  images: string[];
}

export interface GalleryItem {
  id: string;
  eventId: string;
  userId?: string; // Owner ID
  url: string;
  approved: boolean;
  status: 'pending' | 'approved' | 'rejected';
  description: string;
  feedback?: string; // Reason for rejection
  isOfficial?: boolean; // True for admin-uploaded official photos
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
  user?: {
    id: string;
    name: string;
    avatar: string | null;
  };
  event?: {
    id: string;
    title: string;
  };
}

export interface AppConfig {
  donationsEnabled: boolean;
  paymentLink: string;
  aliasCbu: string;
  qrImage: string;
  homeGalleryImages: string[]; // Imágenes editables del home
  // Hero Editable Fields
  heroTitle: string;
  heroSubtitle: string;
  heroDateText: string; // Texto libre ej "28 MARZO - BS AS"
  // Donation Campaign Fields
  donationTitle?: string;
  donationDescription?: string;
  donationImage?: string;
  donationGoal?: number;
  // Cosplay Limit
  cosplayLimit?: number; // Límite de cupos para concurso de cosplay
}

export interface Donation {
  id: string;
  donorName?: string;
  amount: number;
  isAnonymous: boolean;
  message?: string;
  createdAt: string;
}

export interface DonationStats {
  total: number;
  count: number;
  recent: Donation[];
}
