
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
  status: 'Inscripto' | 'Confirmado' | 'Rechazado';
  messages: ChatMessage[];
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
}
