import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../App';
import { UserRole, StandApplication, Event, Sponsor, Giveaway, AppConfig, CosplayRegistration, CosplayGuest, GalleryItem, User, Karaoke } from '../types';
import { SectionTitle, MangaCard, Badge, Button, Input } from '../components/UI';
import {
  getStats, getStandApplications, updateStandStatus, getConfig, updateConfig,
  getEvents, saveEvent, deleteEvent,
  getSponsors, saveSponsor, deleteSponsor,
  getGiveaways, saveGiveaway, deleteGiveaway,
  getGallery, getOfficialGallery, approveGalleryItem, deleteGalleryItem, updateGalleryItem, rejectGalleryItem, addOfficialGalleryItem,
  addStandMessage, getCosplayRegistrations, updateCosplayStatus, addCosplayMessage, deleteCosplayRegistration,
  getCosplayGuests, getCosplayGuestById, getCosplayGuestMessages, updateCosplayGuestStatus, addCosplayGuestMessage, deleteCosplayGuest,
  getUnreadNotificationCount, markAllNotificationsAsRead,
  getAllUsers, updateUser, deleteUser, getAuth, deleteStand,
  getKaraokeRegistrations, updateKaraokeStatus, deleteKaraoke
} from '../services/data';
import { api } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Plus, Edit, Trash2, Check, X, Ghost, Image, Gift, Calendar, Store, DollarSign, Upload, ExternalLink, MessageCircle, Send, ZoomIn, Save, AlertTriangle, RefreshCw, Link as LinkIcon, Film, Paperclip, Trophy, Eye, Mic2, Phone, Users, Sparkles, Star, Clock, Instagram, Globe, Mic, Music } from 'lucide-react';

// --- Helper Components for Modals ---
const Modal = ({ title, onClose, children }: { title: string, onClose: () => void, children: React.ReactNode }) => (
  <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-2 sm:p-4 backdrop-blur-sm">
    <div className="bg-white border-2 border-black shadow-manga w-full max-w-lg max-h-[95vh] sm:max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200 flex flex-col">
      <div className="flex justify-between items-center bg-black text-white p-3 sm:p-4 sticky top-0 z-10 shrink-0">
        <h3 className="font-display text-lg sm:text-xl">{title}</h3>
        <button onClick={onClose}><X size={20} className="sm:w-6 sm:h-6" /></button>
      </div>
      <div className="p-4 sm:p-6 grow overflow-y-auto">
        {children}
      </div>
    </div>
  </div>
);

// Special wider modal for photo moderation
const PhotoModal = ({ title, onClose, children }: { title: string, onClose: () => void, children: React.ReactNode }) => (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-2 sm:p-4 backdrop-blur-md">
      <div className="bg-white border-2 border-black shadow-manga w-full max-w-4xl max-h-[95vh] overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col">
        <div className="flex justify-between items-center bg-black text-white p-3 sm:p-4 sticky top-0 z-10 shrink-0">
          <h3 className="font-display text-lg sm:text-xl">{title}</h3>
          <button onClick={onClose}><X size={20} className="sm:w-6 sm:h-6" /></button>
        </div>
        <div className="grow overflow-y-auto p-0 flex flex-col md:flex-row">
          {children}
        </div>
      </div>
    </div>
  );

// --- Robust Media Input Component ---
const MediaManager = ({ media, onChange, max = 5, label = "Galería", useCloudinary = false }: { media: string[], onChange: (m: string[]) => void, max?: number, label?: string, useCloudinary?: boolean }) => {
  const [urlInput, setUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { auth } = useAuth();

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Solo permitir imágenes
      if (!file.type.startsWith('image/')) {
        alert('⚠️ Solo se permiten imágenes. Para videos, usa el botón "Link Video" con una URL de YouTube/Vimeo.');
        e.target.value = '';
        return;
      }

      if (media.length >= max) {
        alert(`⚠️ Ya alcanzaste el límite de ${max} elementos`);
        e.target.value = '';
        return;
      }

      // Si useCloudinary está activado, subir a Cloudinary
      if (useCloudinary && auth?.token) {
        try {
          setUploading(true);
          const formData = new FormData();
          formData.append('file', file);

          const res = await fetch('http://localhost:3001/api/v1/uploads/image', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${auth.token}`,
            },
            body: formData,
          });

          if (!res.ok) throw new Error('Upload failed');

          const data = await res.json();
          onChange([...media, data.secure_url]);
        } catch (error) {
          console.error('Error uploading to Cloudinary:', error);
          alert('❌ Error subiendo la imagen. Intenta nuevamente.');
        } finally {
          setUploading(false);
        }
      } else {
        // Usar base64 (no recomendado para producción)
        const reader = new FileReader();
        reader.onloadend = () => {
          if (media.length < max) {
            onChange([...media, reader.result as string]);
          }
        };
        reader.readAsDataURL(file);
      }

      // Reset input
      e.target.value = '';
    }
  };

  const handleAddUrl = () => {
    const url = urlInput.trim();
    if (!url) return;

    if (media.length >= max) {
      alert(`⚠️ Ya alcanzaste el límite de ${max} elementos`);
      return;
    }

    // Validar que sea una URL válida
    try {
      new URL(url);
    } catch {
      alert('⚠️ Por favor ingresa una URL válida (debe comenzar con http:// o https://)');
      return;
    }

    onChange([...media, url]);
    setUrlInput('');
    setShowUrlInput(false);
  };

  const handleRemove = (idx: number) => {
    onChange(media.filter((_, i) => i !== idx));
  };

  // Helper to detect if it looks like a video link
  const isVideo = (url: string) => url.includes('youtube') || url.includes('vimeo') || url.includes('mp4');

  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-2">
        <label className="block text-sm font-bold uppercase">{label} <span className="text-gray-400 text-xs">({media.length}/{max})</span></label>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3">
        {media.map((item, idx) => (
          <div key={idx} className="relative aspect-square border border-black group bg-gray-100 flex items-center justify-center overflow-hidden">
             {isVideo(item) ? (
                 <div className="flex flex-col items-center justify-center text-red-600">
                     <Film size={24} />
                     <span className="text-xs font-bold mt-1 text-center truncate w-full px-1">Video Link</span>
                 </div>
             ) : (
                 <img src={item} alt="preview" className="w-full h-full object-cover" />
             )}
             <button 
                type="button" 
                onClick={() => handleRemove(idx)}
                className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
             >
                <X size={12} />
             </button>
          </div>
        ))}
        {media.length < max && (
            <div className="flex flex-col gap-1">
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="flex-1 border-2 border-dashed border-gray-400 hover:border-torami-red hover:text-torami-red flex flex-col items-center justify-center text-gray-500 transition-colors text-xs p-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Upload size={16} className="mb-1" />
                    {uploading ? 'Subiendo...' : 'Subir Imagen'}
                </button>
                <button 
                    type="button" 
                    onClick={() => setShowUrlInput(!showUrlInput)}
                    className="flex-1 border-2 border-dashed border-gray-400 hover:border-blue-500 hover:text-blue-500 flex flex-col items-center justify-center text-gray-500 transition-colors text-xs p-2"
                >
                    <LinkIcon size={16} className="mb-1" /> Link Video
                </button>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFile} />
            </div>
        )}
      </div>

      {showUrlInput && (
          <div className="flex gap-2 animate-in fade-in slide-in-from-top-1">
              <input 
                 type="text" 
                 className="grow border-2 border-black p-2 text-sm focus:outline-none" 
                 placeholder="Pegar URL de video o imagen..."
                 value={urlInput}
                 onChange={(e) => setUrlInput(e.target.value)}
              />
              <Button type="button" onClick={handleAddUrl} className="py-1 px-3 text-sm">Agregar</Button>
          </div>
      )}
    </div>
  );
};

// Pagination Component
const PaginationControls = ({
  page,
  totalPages,
  total,
  limit,
  onPageChange,
  onLimitChange
}: {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}) => {
  if (total === 0) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 mt-4 p-3 bg-gray-50 border-2 border-black">
      <div className="flex items-center gap-2 text-sm">
        <span className="font-bold">Mostrar:</span>
        <select
          value={limit}
          onChange={(e) => onLimitChange(Number(e.target.value))}
          className="border-2 border-black p-1 bg-white"
        >
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={50}>50</option>
        </select>
        <span className="text-gray-600">| Total: {total} registros</span>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(1)}
          disabled={page === 1}
          className="px-2 py-1 border-2 border-black bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
        >
          ««
        </button>
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="px-2 py-1 border-2 border-black bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
        >
          «
        </button>
        <span className="px-3 py-1 border-2 border-black bg-torami-red text-white font-bold">
          {page} / {totalPages || 1}
        </span>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="px-2 py-1 border-2 border-black bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
        >
          »
        </button>
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={page >= totalPages}
          className="px-2 py-1 border-2 border-black bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
        >
          »»
        </button>
      </div>
    </div>
  );
};

export const Admin = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<'dashboard'|'stands'|'events'|'sponsors'|'giveaways'|'gallery'|'officialgallery'|'config'|'cosplay'|'cosplayguest'|'karaoke'|'users'>('dashboard');
  const [pendingChatId, setPendingChatId] = useState<string | null>(null);

  // Data State
  const [stats, setStats] = useState<any>(null);
  const [stands, setStands] = useState<StandApplication[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [cosplayers, setCosplayers] = useState<CosplayRegistration[]>([]);
  const [cosplayGuests, setCosplayGuests] = useState<CosplayGuest[]>([]);
  const [karaokeList, setKaraokeList] = useState<Karaoke[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [giveaways, setGiveaways] = useState<Giveaway[]>([]);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [officialGallery, setOfficialGallery] = useState<GalleryItem[]>([]);
  const [config, setConfig] = useState<AppConfig>({ donationsEnabled: false, paymentLink: '', aliasCbu: '', qrImage: '', homeGalleryImages: [], heroTitle: '', heroSubtitle: '', heroDateText: '', donationTitle: '', donationDescription: '', donationImage: '', donationGoal: undefined });
  const [configNotice, setConfigNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isTogglingDonations, setIsTogglingDonations] = useState(false);

  // Pagination State
  const [pagination, setPagination] = useState({
    stands: { page: 1, limit: 10, total: 0, totalPages: 0 },
    cosplay: { page: 1, limit: 10, total: 0, totalPages: 0 },
    cosplayguest: { page: 1, limit: 10, total: 0, totalPages: 0 },
    users: { page: 1, limit: 10, total: 0, totalPages: 0 },
  });

  // Edit State
  const [editingEvent, setEditingEvent] = useState<Partial<Event> | null>(null);
  const [editingSponsor, setEditingSponsor] = useState<Partial<Sponsor> | null>(null);
  const [editingGiveaway, setEditingGiveaway] = useState<Partial<Giveaway> | null>(null);
  const [editingUser, setEditingUser] = useState<Partial<User> | null>(null);
  
  // Chat & Detail State (Stands)
  const [chatStand, setChatStand] = useState<StandApplication | null>(null);
  const [viewStand, setViewStand] = useState<StandApplication | null>(null); // State for viewing stand details
  const [isRejectingStand, setIsRejectingStand] = useState(false);
  const [standRejectionReason, setStandRejectionReason] = useState('');

  // Chat & Detail State (Cosplay)
  const [viewCosplay, setViewCosplay] = useState<CosplayRegistration | null>(null);
  const [chatCosplay, setChatCosplay] = useState<CosplayRegistration | null>(null);
  const [isRejectingCosplay, setIsRejectingCosplay] = useState(false);

  // Image Viewer
  const [viewImage, setViewImage] = useState<string | null>(null);
  const [cosplayRejectionReason, setCosplayRejectionReason] = useState('');

  // Notifications
  const [unreadCount, setUnreadCount] = useState(0);

  const [chatMessage, setChatMessage] = useState('');
  const [chatImage, setChatImage] = useState<string | null>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const chatFileRef = useRef<HTMLInputElement>(null);
  const chatStandRef = useRef<StandApplication | null>(null);
  const chatCosplayRef = useRef<CosplayRegistration | null>(null);
  const chatClosedByUserRef = useRef(false);

  // Gallery Moderation State
  const [selectedPhoto, setSelectedPhoto] = useState<GalleryItem | null>(null);
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Official Gallery Upload State
  const [showOfficialUpload, setShowOfficialUpload] = useState(false);
  const [officialUploadData, setOfficialUploadData] = useState({ eventId: '', description: '', url: '' });

  // Cosplay Guest Delete State
  const [deletingCosplayGuest, setDeletingCosplayGuest] = useState<CosplayGuest | null>(null);
  const [showDeleteCosplayGuestConfirm, setShowDeleteCosplayGuestConfirm] = useState(false);

  // Stand Delete State
  const [deletingStand, setDeletingStand] = useState<StandApplication | null>(null);
  const [showDeleteStandConfirm, setShowDeleteStandConfirm] = useState(false);

  // Cosplay Registration Delete State
  const [deletingCosplay, setDeletingCosplay] = useState<CosplayRegistration | null>(null);
  const [showDeleteCosplayConfirm, setShowDeleteCosplayConfirm] = useState(false);

  // Karaoke Delete State
  const [deletingKaraoke, setDeletingKaraoke] = useState<Karaoke | null>(null);
  const [showDeleteKaraokeConfirm, setShowDeleteKaraokeConfirm] = useState(false);

  // User Delete State
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [showDeleteUserConfirm, setShowDeleteUserConfirm] = useState(false);

  // Carga datos específicos del tab activo (optimizado para reducir requests innecesarios)
  const loadTabData = (tab: string, updateOpenChat = false) => {
    switch (tab) {
      case 'dashboard':
        // Dashboard necesita stats y notificaciones
        getStats().then((data) => {
          setStats(data);
        }).catch((err) => {
          console.error('Error fetching stats:', err);
          setStats({ users: { total: 0 }, events: { total: 0 }, stands: { pending: 0 }, giveaways: { active: 0 } });
        });
        getUnreadNotificationCount().then((data: any) => setUnreadCount(data.count));
        break;

      case 'events':
        getEvents().then((data) => {
          setEvents(data);
        });
        break;

      case 'stands':
        getStandApplications(pagination.stands.page, pagination.stands.limit).then((response: any) => {
          const data = Array.isArray(response) ? response : response.data || [];
          setStands(data);
          if (response.total !== undefined) {
            setPagination(prev => ({
              ...prev,
              stands: { ...prev.stands, total: response.total, totalPages: Math.ceil(response.total / prev.stands.limit) }
            }));
          }
          if (updateOpenChat && chatStandRef.current) {
            const updatedStand = data.find((s: any) => s.id === chatStandRef.current!.id);
            if (updatedStand) setChatStand(updatedStand);
          }
        });
        break;

      case 'cosplay':
        getCosplayRegistrations(pagination.cosplay.page, pagination.cosplay.limit).then((response: any) => {
          const data = Array.isArray(response) ? response : response.data || [];
          setCosplayers(data);
          if (response.total !== undefined) {
            setPagination(prev => ({
              ...prev,
              cosplay: { ...prev.cosplay, total: response.total, totalPages: Math.ceil(response.total / prev.cosplay.limit) }
            }));
          }
          if (updateOpenChat && chatCosplayRef.current) {
            const updatedCos = data.find((c: any) => c.id === chatCosplayRef.current!.id);
            if (updatedCos) setChatCosplay(updatedCos);
          }
        });
        break;

      case 'cosplayguest':
        getCosplayGuests(pagination.cosplayguest.page, pagination.cosplayguest.limit).then((res: any) => {
          const data = Array.isArray(res) ? res : res.data || [];
          setCosplayGuests(data);
          if (res.total !== undefined) {
            setPagination(prev => ({
              ...prev,
              cosplayguest: { ...prev.cosplayguest, total: res.total, totalPages: Math.ceil(res.total / prev.cosplayguest.limit) }
            }));
          }
          if (updateOpenChat && chatCosplayRef.current) {
            // Check if the active chat is a guest (has assignedNumber)
            const isGuest = (chatCosplayRef.current as any).assignedNumber !== undefined;
            if (isGuest) {
              const updatedGuest = (data || []).find((g: any) => g.id === chatCosplayRef.current!.id);
              if (updatedGuest) {
                setChatCosplay((prev: any) => ({
                  ...updatedGuest,
                  messages: prev?.messages || [],
                }));
              }
            }
          }
        });
        break;

      case 'gallery':
        getGallery().then(setGallery);
        break;

      case 'officialgallery':
        getOfficialGallery().then(setOfficialGallery);
        getEvents().then(setEvents); // Need events for the upload form
        break;

      case 'giveaways':
        getGiveaways().then(setGiveaways);
        break;

      case 'sponsors':
        getSponsors().then(setSponsors);
        break;

      case 'users':
        getAllUsers(pagination.users.page, pagination.users.limit).then((res: any) => {
          const data = Array.isArray(res) ? res : res.data || [];
          setUsers(data);
          if (res.total !== undefined) {
            setPagination(prev => ({
              ...prev,
              users: { ...prev.users, total: res.total, totalPages: Math.ceil(res.total / prev.users.limit) }
            }));
          }
        });
        break;

      case 'config':
        getConfig(true).then(setConfig);
        break;

      case 'karaoke':
        getKaraokeRegistrations().then(setKaraokeList);
        getEvents().then(setEvents); // Necesario para filtrar por evento
        break;

      default:
        console.warn('Unknown tab:', tab);
    }
  };

  // Helper: Recarga solo el tab actual (optimizado)
  const refreshCurrentTab = (updateOpenChat = false) => {
    loadTabData(activeTab, updateOpenChat);
  };

  // Pagination handlers
  const handlePageChange = (section: 'stands' | 'cosplay' | 'cosplayguest' | 'users', newPage: number) => {
    setPagination(prev => ({
      ...prev,
      [section]: { ...prev[section], page: newPage }
    }));
  };

  const handleLimitChange = (section: 'stands' | 'cosplay' | 'cosplayguest' | 'users', newLimit: number) => {
    setPagination(prev => ({
      ...prev,
      [section]: { ...prev[section], limit: newLimit, page: 1 } // Reset to page 1 when changing limit
    }));
  };

  // Reload data when pagination changes
  useEffect(() => {
    if (activeTab === 'stands') loadTabData('stands');
  }, [pagination.stands.page, pagination.stands.limit]);

  useEffect(() => {
    if (activeTab === 'cosplay') loadTabData('cosplay');
  }, [pagination.cosplay.page, pagination.cosplay.limit]);

  useEffect(() => {
    if (activeTab === 'cosplayguest') loadTabData('cosplayguest');
  }, [pagination.cosplayguest.page, pagination.cosplayguest.limit]);

  useEffect(() => {
    if (activeTab === 'users') loadTabData('users');
  }, [pagination.users.page, pagination.users.limit]);

  // Función legacy para refresh manual (cuando se necesite recargar todo)
  const refreshData = (updateOpenChat = false) => {
    getStats().then((data) => {
      setStats(data);
    }).catch((err) => {
      console.error('Error fetching stats:', err);
      setStats({ users: { total: 0 }, events: { total: 0 }, stands: { pending: 0 }, giveaways: { active: 0 } });
    });
    getStandApplications(pagination.stands.page, pagination.stands.limit).then((response: any) => {
        const data = Array.isArray(response) ? response : response.data || [];
        setStands(data);
        if (response.total !== undefined) {
          setPagination(prev => ({
            ...prev,
            stands: { ...prev.stands, total: response.total, totalPages: Math.ceil(response.total / prev.stands.limit) }
          }));
        }
        if (updateOpenChat && chatStandRef.current) {
            const updatedStand = data.find((s: any) => s.id === chatStandRef.current!.id);
            if (updatedStand) setChatStand(updatedStand);
        }
    });
    getCosplayRegistrations(pagination.cosplay.page, pagination.cosplay.limit).then((response: any) => {
        const data = Array.isArray(response) ? response : response.data || [];
        setCosplayers(data);
        if (response.total !== undefined) {
          setPagination(prev => ({
            ...prev,
            cosplay: { ...prev.cosplay, total: response.total, totalPages: Math.ceil(response.total / prev.cosplay.limit) }
          }));
        }
        if (updateOpenChat && chatCosplayRef.current) {
            const updatedCos = data.find((c: any) => c.id === chatCosplayRef.current!.id);
            if(updatedCos) setChatCosplay(updatedCos);
        }
    });
    getCosplayGuests(pagination.cosplayguest.page, pagination.cosplayguest.limit).then((res: any) => {
      const data = Array.isArray(res) ? res : res.data || [];
      setCosplayGuests(data);
      if (res.total !== undefined) {
        setPagination(prev => ({
          ...prev,
          cosplayguest: { ...prev.cosplayguest, total: res.total, totalPages: Math.ceil(res.total / prev.cosplayguest.limit) }
        }));
      }
    });
    getEvents().then((data) => {
      setEvents(data);
    });
    getSponsors().then(setSponsors);
    getGiveaways().then(setGiveaways);
    getGallery().then(setGallery);
    getOfficialGallery().then(setOfficialGallery);
    getConfig(false).then(setConfig);
    getAllUsers(pagination.users.page, pagination.users.limit).then((res: any) => {
      const data = Array.isArray(res) ? res : res.data || [];
      setUsers(data);
      if (res.total !== undefined) {
        setPagination(prev => ({
          ...prev,
          users: { ...prev.users, total: res.total, totalPages: Math.ceil(res.total / prev.users.limit) }
        }));
      }
    });
    getUnreadNotificationCount().then((data: any) => setUnreadCount(data.count));
  };

  // ✅ Solo carga datos del tab activo (optimizado)
  useEffect(() => {
    loadTabData(activeTab);
  }, [activeTab]);

  // Handle URL query params for opening specific chat from notifications
  useEffect(() => {
    const tab = searchParams.get('tab');
    const chatId = searchParams.get('chat');

    if (tab && ['stands', 'cosplay', 'cosplayguest'].includes(tab)) {
      setActiveTab(tab as any);
      if (chatId) {
        setPendingChatId(chatId);
      }
      // Clear query params after reading
      setSearchParams({}, { replace: true });
    }
  }, [searchParams]);

  // Open chat when data is loaded and we have a pending chat ID
  useEffect(() => {
    if (!pendingChatId) return;

    if (activeTab === 'stands' && stands.length > 0) {
      const stand = stands.find(s => s.id === pendingChatId);
      if (stand) {
        setChatStand(stand);
        setPendingChatId(null);
      }
    } else if (activeTab === 'cosplay' && cosplayers.length > 0) {
      const cosplay = cosplayers.find(c => c.id === pendingChatId);
      if (cosplay) {
        setChatCosplay(cosplay);
        setPendingChatId(null);
      }
    } else if (activeTab === 'cosplayguest' && cosplayGuests.length > 0) {
      const guest = cosplayGuests.find(g => g.id === pendingChatId);
      if (guest) {
        setChatCosplay(guest as any); // cosplayguest uses same chat component
        setPendingChatId(null);
      }
    }
  }, [pendingChatId, activeTab, stands, cosplayers, cosplayGuests]);

  // Sync refs with state
  useEffect(() => {
    chatStandRef.current = chatStand;
    chatCosplayRef.current = chatCosplay;
  }, [chatStand, chatCosplay]);

  // Auto-refresh notifications every 5 MINUTES (reduced from 10 seconds to save bandwidth)
  useEffect(() => {
    const intervalId = setInterval(() => {
      getUnreadNotificationCount().then((data: any) => setUnreadCount(data.count));
    }, 5 * 60 * 1000); // Check every 5 MINUTES (was 10 seconds - too aggressive!)

    return () => clearInterval(intervalId);
  }, []);

  // Mark all notifications as read when opening chat
  useEffect(() => {
    if (chatStand || chatCosplay) {
      markAllNotificationsAsRead().then(() => {
        setUnreadCount(0);
      });
    }
  }, [chatStand?.id, chatCosplay?.id]);

  useEffect(() => {
    if (!chatCosplay) return;
    const isGuest = (chatCosplay as any).assignedNumber !== undefined;
    if (isGuest) {
      refreshCosplayGuestMessages(chatCosplay.id);
    }
  }, [chatCosplay?.id]);

  async function refreshCosplayGuestMessages(id: string) {
    const data = await getCosplayGuestMessages(id);
    setChatCosplay((prev: any) => {
      if (!prev || prev.id !== id) return prev;
      return { ...prev, messages: data?.messages || [] };
    });
  }

  // Auto-refresh chat messages every 10 SECONDS when chat is open (chat needs faster updates)
  useEffect(() => {
    const chatIsOpen = chatStand !== null || chatCosplay !== null;

    // Reset the manual close flag when chat opens
    if (chatIsOpen) {
      chatClosedByUserRef.current = false;
    }

    if (!chatIsOpen || chatClosedByUserRef.current) return;

    // Determine which tab data to refresh based on open chat
    let tabToRefresh: string;
    if (chatStand) {
      tabToRefresh = 'stands';
    } else if (chatCosplay) {
      // Check if it's a cosplay guest (has assignedNumber) or normal registration
      const isGuest = (chatCosplay as any).assignedNumber !== undefined;
      tabToRefresh = isGuest ? 'cosplayguest' : 'cosplay';
    } else {
      return; // Should never happen, but TypeScript safety
    }

    // Set up polling interval with chat update enabled (without initial refresh)
    const intervalId = setInterval(() => {
      if (chatClosedByUserRef.current) return;
      if (tabToRefresh === 'cosplayguest' && chatCosplay) {
        refreshCosplayGuestMessages(chatCosplay.id);
        return;
      }
      loadTabData(tabToRefresh, true);
    }, 10 * 1000); // Refresh every 10 SECONDS (chat needs real-time updates)

    // Cleanup on unmount or when chat closes
    return () => clearInterval(intervalId);
  }, [chatStand?.id, chatCosplay?.id]);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatStand?.messages, chatCosplay?.messages]);

  // Reset rejection state when opening a modal
  useEffect(() => {
    if (selectedPhoto) {
      setIsRejecting(false);
      setRejectionReason(selectedPhoto.feedback || '');
    }
    if (viewCosplay) {
        setIsRejectingCosplay(false);
        setCosplayRejectionReason('');
    }
    if (viewStand) {
        setIsRejectingStand(false);
        setStandRejectionReason('');
    }
  }, [selectedPhoto, viewCosplay, viewStand]);

  if (!user || (user.role !== UserRole.ADMIN && user.role !== UserRole.SUPER_ADMIN)) {
    return <div className="p-10 text-center text-red-600 font-bold">Acceso Denegado</div>;
  }

  // --- Handlers ---

  // Stands
  const handleStandStatus = async (id: string, status: 'Aprobada' | 'Rechazada') => {
    await updateStandStatus(id, status);
    refreshCurrentTab();
    if(viewStand && viewStand.id === id) setViewStand(null);
  };

  const handleExecuteStandRejection = async () => {
      if (!viewStand) return;

      // 1. Update status
      await updateStandStatus(viewStand.id, 'Rechazada');
      
      // 2. Send Chat Message if reason is provided
      if (standRejectionReason.trim()) {
          const reasonMsg = `⚠️ SOLICITUD RECHAZADA.\n\nMotivo: ${standRejectionReason}\n\nPuedes ajustar tu propuesta y avisarnos por este chat.`;
          await addStandMessage(viewStand.id, reasonMsg, 'ADMIN');
      }

      // 3. Cleanup
      setIsRejectingStand(false);
      setStandRejectionReason('');
      refreshCurrentTab();
      setViewStand(null);
  };

  // Cosplay - Load full details
  const handleViewCosplayDetails = async (cosplay: CosplayRegistration | CosplayGuest) => {
    // Check if it's a guest (has assignedNumber)
    const isGuest = (cosplay as any).assignedNumber !== undefined;

    if (isGuest) {
      const fullDetails = await getCosplayGuestById(cosplay.id);
      setViewCosplay(fullDetails as any);
    } else {
      // For regular cosplay, fetch full details from API
      const { token } = getAuth();
      const fullDetails = await api.cosplay.getOne(token || '', cosplay.id);
      setViewCosplay(fullDetails);
    }
  };

  const handleCosplayStatus = async (id: string, status: 'Confirmado') => {
    // Detect if it's a guest (has assignedNumber)
    const isGuest = viewCosplay && (viewCosplay as any).assignedNumber !== undefined;

    if (isGuest) {
      await updateCosplayGuestStatus(id, status);
    } else {
      await updateCosplayStatus(id, status);
    }

    refreshCurrentTab();
    if (viewCosplay && viewCosplay.id === id) setViewCosplay(null); // Close modal if modifying current
  };

  const handleExecuteCosplayRejection = async () => {
      if (!viewCosplay) return;

      // Detect if it's a guest (has assignedNumber)
      const isGuest = (viewCosplay as any).assignedNumber !== undefined;

      try {
        // 1. Update status (same flow for Guest, Concurso, and Stand - no deletion on reject)
        if (isGuest) {
          await updateCosplayGuestStatus(viewCosplay.id, 'Rechazado');
        } else {
          await updateCosplayStatus(viewCosplay.id, 'Rechazado');
        }

        // 2. Send Chat Message if reason is provided
        if (cosplayRejectionReason.trim()) {
            const reasonMsg = `⚠️ TU INSCRIPCIÓN FUE RECHAZADA.\n\nMotivo: ${cosplayRejectionReason}\n\nPor favor, corregí lo necesario y avisanos por este chat.`;

            if (isGuest) {
              await addCosplayGuestMessage(viewCosplay.id, reasonMsg, 'ADMIN');
            } else {
              await addCosplayMessage(viewCosplay.id, reasonMsg, 'ADMIN');
            }
        }

        // 3. Cleanup and refresh
        setIsRejectingCosplay(false);
        setCosplayRejectionReason('');
        refreshCurrentTab();

        // 4. Close modal
        setViewCosplay(null);
      } catch (error) {
        console.error('Error al rechazar:', error);
        alert('Error al rechazar. Refrescando datos...');
        setIsRejectingCosplay(false);
        setCosplayRejectionReason('');
        setViewCosplay(null);
        refreshCurrentTab();
      }
  };

  // Handle delete cosplay guest
  const handleDeleteCosplayGuest = async () => {
    if (!deletingCosplayGuest) return;

    try {
      await deleteCosplayGuest(deletingCosplayGuest.id);
      setCosplayGuests(prev => prev.filter(g => g.id !== deletingCosplayGuest.id));
      setShowDeleteCosplayGuestConfirm(false);
      setDeletingCosplayGuest(null);
      // Close detail modal if open
      if (viewCosplay?.id === deletingCosplayGuest.id) {
        setViewCosplay(null);
      }
    } catch (error) {
      console.error('Error deleting cosplay guest:', error);
      alert('❌ Error al eliminar el registro');
    }
  };

  // Handle delete stand
  const handleDeleteStand = async () => {
    if (!deletingStand) return;

    try {
      await deleteStand(deletingStand.id);
      setStands(prev => prev.filter(s => s.id !== deletingStand.id));
      setShowDeleteStandConfirm(false);
      setDeletingStand(null);
      // Close detail/chat modal if open
      if (viewStand?.id === deletingStand.id) {
        setViewStand(null);
      }
      if (chatStand?.id === deletingStand.id) {
        setChatStand(null);
      }
    } catch (error) {
      console.error('Error deleting stand:', error);
      alert('❌ Error al eliminar el stand');
    }
  };

  // Handle delete cosplay registration
  const handleDeleteCosplayRegistration = async () => {
    if (!deletingCosplay) return;

    try {
      await deleteCosplayRegistration(deletingCosplay.id);
      setCosplayers(prev => prev.filter(c => c.id !== deletingCosplay.id));
      setShowDeleteCosplayConfirm(false);
      setDeletingCosplay(null);
      // Close detail/chat modal if open
      if (viewCosplay?.id === deletingCosplay.id) {
        setViewCosplay(null);
      }
      if (chatCosplay?.id === deletingCosplay.id) {
        setChatCosplay(null);
      }
    } catch (error) {
      console.error('Error deleting cosplay registration:', error);
      alert('❌ Error al eliminar el registro');
    }
  };

  const handleDeleteUser = async () => {
    if (!deletingUser) return;

    try {
      await deleteUser(deletingUser.id);
      setUsers(prev => prev.filter(u => u.id !== deletingUser.id));
      setShowDeleteUserConfirm(false);
      setDeletingUser(null);
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('❌ Error al eliminar el usuario');
    }
  };

  const handleChatFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onloadend = () => {
            setChatImage(reader.result as string);
        };
        reader.readAsDataURL(file);
    }
  };

  const handleSendChatMessage = async (e: React.FormEvent) => {
      e.preventDefault();
      if ((!chatStand && !chatCosplay) || (!chatMessage.trim() && !chatImage)) return;

      if (chatStand) {
          await addStandMessage(chatStand.id, chatMessage, 'ADMIN', chatImage || undefined);
      } else if (chatCosplay) {
          // Detect if this is a cosplay guest (has assignedNumber) or normal registration
          const isGuest = (chatCosplay as any).assignedNumber !== undefined;

          if (isGuest) {
              await addCosplayGuestMessage(chatCosplay.id, chatMessage, 'ADMIN', chatImage || undefined);
          } else {
              await addCosplayMessage(chatCosplay.id, chatMessage, 'ADMIN', chatImage || undefined);
          }
      }

      setChatMessage('');
      setChatImage(null);
      refreshCurrentTab(true);
  };

  // Events
  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingEvent) {
        // Convertir fecha DD/MM/YYYY a YYYY-MM-DD
        let dateFormatted = '';
        if (editingEvent.date) {
            const dateParts = editingEvent.date.split('/');
            if (dateParts.length === 3) {
                const [day, month, year] = dateParts;
                dateFormatted = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
            } else {
                dateFormatted = editingEvent.date; // Si ya está en formato ISO
            }
        }

        const eventDate = new Date(`${dateFormatted}T${editingEvent.time?.split(' - ')[0] || '00:00'}`);
        const isPast = eventDate < new Date();

        // Convertir fecha a formato ISO-8601 completo (sin conversión de zona horaria)
        const dateISO = dateFormatted
          ? `${dateFormatted}T12:00:00.000Z` // Usar mediodía UTC para evitar problemas de zona horaria
          : new Date().toISOString();

        // Eliminar campos que el backend no acepta al actualizar
        const { id, createdAt, updatedAt, highlights, transport, ...eventData } = editingEvent as any;

        const eventToSave = {
            ...eventData,
            date: dateISO,
            tags: typeof editingEvent.tags === 'string' ? (editingEvent.tags as string).split(',').map(t => t.trim()) : editingEvent.tags || [],
            isPast: isPast,
            // Images are handled in state directly
            images: editingEvent.images || []
        };

        try {
            // Enviar datos con ID (el servicio se encarga de manejarlo correctamente)
            if (editingEvent.id) {
                await saveEvent({ ...eventToSave, id: editingEvent.id });
            } else {
                await saveEvent(eventToSave);
            }

            setEditingEvent(null);
            refreshCurrentTab();
        } catch (error: any) {
            console.error('Error al guardar evento:', error);
            const errorMsg = error?.message || JSON.stringify(error) || 'Error desconocido';
            alert(`Error al guardar evento:\n${errorMsg}`);
        }
    }
  };
  const handleDeleteEvent = async (id: string) => {
    if (window.confirm('¿Eliminar evento permanentemente?')) {
        await deleteEvent(id);
        refreshCurrentTab();
    }
  };

  // Sponsors
  const handleSaveSponsor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSponsor) {
        await saveSponsor(editingSponsor as Sponsor);
        setEditingSponsor(null);
        refreshCurrentTab();
    }
  };
  const handleDeleteSponsor = async (id: string) => {
    if (window.confirm('¿Eliminar sponsor?')) await deleteSponsor(id);
    refreshCurrentTab();
  };

  // Giveaways
  const handleSaveGiveaway = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingGiveaway) {
        await saveGiveaway(editingGiveaway as Giveaway);
        setEditingGiveaway(null);
        refreshCurrentTab();
    }
  };
  const handleDeleteGiveaway = async (id: string) => {
      if (window.confirm('¿Eliminar sorteo?')) await deleteGiveaway(id);
      refreshCurrentTab();
  };

  // Users
  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser && editingUser.id) {
        const { id, createdAt, ...updateData } = editingUser;
        await updateUser(id, updateData);
        setEditingUser(null);
        refreshCurrentTab();
    }
  };

  // Gallery - OPTIMIZED with optimistic updates
  const handleGalleryApprove = async () => {
    if (selectedPhoto) {
        try {
          // 1. Send to backend and wait for response with admin info
          const updatedPhoto = await approveGalleryItem(selectedPhoto.id);

          // 2. Update UI with real data from backend (includes approvedBy, approvedByName, approvedAt)
          setGallery(gallery.map(p => p.id === selectedPhoto.id ? updatedPhoto : p));

          // If photo is official, also add to official gallery
          if (selectedPhoto.isOfficial) {
              setOfficialGallery([...officialGallery, updatedPhoto]);
          }

          setSelectedPhoto(null);
        } catch (error) {
          console.error('Error aprobando foto:', error);
          alert('Error al aprobar la foto. Recargando...');
          refreshCurrentTab();
        }
    }
  };

  const handleGalleryReject = async () => {
      if (selectedPhoto && rejectionReason.trim()) {
          try {
            // 1. Send to backend and wait for response with admin info
            const updatedPhoto = await rejectGalleryItem(selectedPhoto.id, rejectionReason);

            // 2. Update UI with real data from backend (includes approvedBy, approvedByName, approvedAt)
            setGallery(gallery.map(p => p.id === selectedPhoto.id ? updatedPhoto : p));
            setSelectedPhoto(null);
            setIsRejecting(false);
            setRejectionReason('');
          } catch (error) {
              console.error('Error rechazando foto:', error);
              alert('Error: ' + (error?.message || 'No se pudo rechazar la foto. Recargando...'));
              refreshCurrentTab();
          }
      }
  };

  const handleGalleryDelete = async () => {
      if (selectedPhoto) {
          // 1. Update UI immediately (optimistic) - remove from list
          setGallery(gallery.filter(p => p.id !== selectedPhoto.id));
          setOfficialGallery(officialGallery.filter(p => p.id !== selectedPhoto.id));
          setShowDeleteConfirm(false);
          setSelectedPhoto(null);

          // 2. Send to backend in background
          deleteGalleryItem(selectedPhoto.id).catch((error) => {
              console.error('Error eliminando foto:', error);
              alert('Error al eliminar la foto. Recargando...');
              refreshCurrentTab();
          });
      }
  };

  const handleGallerySave = async (e: React.FormEvent) => {
      e.preventDefault();
      if(selectedPhoto) {
          // 1. Update UI immediately (optimistic)
          setGallery(gallery.map(p => p.id === selectedPhoto.id ? selectedPhoto : p));
          if (selectedPhoto.isOfficial) {
              setOfficialGallery(officialGallery.map(p => p.id === selectedPhoto.id ? selectedPhoto : p));
          }
          setSelectedPhoto(null);

          // 2. Send to backend in background
          updateGalleryItem(selectedPhoto).catch((error) => {
              console.error('Error actualizando foto:', error);
              alert('Error al actualizar la foto. Recargando...');
              refreshCurrentTab();
          });
      }
  }

  const handleDeleteOfficialPhoto = (photoId: string) => {
      if (confirm('¿Eliminar esta foto oficial?')) {
          // 1. Update UI immediately (optimistic) - remove from official gallery
          setOfficialGallery(officialGallery.filter(p => p.id !== photoId));
          setGallery(gallery.filter(p => p.id !== photoId));

          // 2. Send to backend in background
          deleteGalleryItem(photoId).catch((error) => {
              console.error('Error eliminando foto oficial:', error);
              alert('Error al eliminar la foto oficial. Recargando...');
              refreshCurrentTab();
          });
      }
  }

  // CONFIG HANDLERS
  const handleConfigToggle = async () => {
    setIsTogglingDonations(true);
    try {
      const newStatus = !config.donationsEnabled;
      // Eliminar campos que no deben enviarse al backend (id, createdAt, updatedAt)
      const { id, createdAt, updatedAt, ...configWithoutId } = config as any;
      const configToSave = { ...configWithoutId, donationsEnabled: newStatus };
      const result = await updateConfig(configToSave);
      // Actualizar con el resultado del servidor
      setConfig(result);
    } catch (error) {
      console.error('Error al cambiar estado de donaciones:', error);
      setConfigNotice({ type: 'error', text: 'No se pudo cambiar el estado de las donaciones.' });
      setTimeout(() => setConfigNotice(null), 3000);
    } finally {
      setIsTogglingDonations(false);
    }
  };
  
  const handleConfigChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = e.target.type === 'number' ? (e.target.value === '' ? undefined : Number(e.target.value)) : e.target.value;
    setConfig({ ...config, [e.target.name]: value });
  };
  
  const handleSaveConfig = async () => {
    try {
      // Eliminar campos que no deben enviarse al backend (id, createdAt, updatedAt)
      const { id, createdAt, updatedAt, ...configToSave } = config as any;

      const result = await updateConfig(configToSave);
      // Actualizar el estado local con el resultado del servidor
      setConfig(result);
      setConfigNotice({ type: 'success', text: 'Configuración guardada correctamente.' });
    } catch (error) {
      console.error('❌ Error guardando config:', error);
      setConfigNotice({ type: 'error', text: 'No pudimos guardar la configuración. Intenta nuevamente.' });
    } finally {
      setTimeout(() => setConfigNotice(null), 3000);
    }
  };

  const TabButton = ({ id, label, icon: Icon }: any) => (
    <button
        onClick={() => setActiveTab(id)}
        className={`flex items-center gap-2 px-4 py-3 font-bold uppercase transition-all whitespace-nowrap ${
            activeTab === id 
            ? 'bg-black text-white border-t-2 border-x-2 border-black -mb-0.5 z-10' 
            : 'bg-white text-gray-500 hover:text-black border-b-2 border-black'
        }`}
    >
        <Icon size={16} /> {label}
    </button>
  );

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-4 py-4 sm:py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6 sm:mb-8">
         <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
           <SectionTitle>Panel de Administración</SectionTitle>
           {unreadCount > 0 && (
             <div className="bg-red-500 text-white px-3 py-1 rounded-full text-xs sm:text-sm font-bold animate-pulse flex items-center gap-2">
               <MessageCircle size={16} />
               {unreadCount} {unreadCount === 1 ? 'mensaje nuevo' : 'mensajes nuevos'}
             </div>
           )}
         </div>
         <div className="text-xs sm:text-sm w-full sm:w-auto text-left sm:text-right">Hola, <span className="font-bold">{user.name}</span> <span className="text-xs bg-gray-200 px-1 rounded">{user.role}</span></div>
      </div>

      {configNotice && (
        <div className={`mb-6 p-4 border-2 shadow-manga animate-in slide-in-from-top-2 ${configNotice.type === 'success' ? 'bg-green-50 border-green-500 text-green-800' : 'bg-red-50 border-red-500 text-red-800'}`}>
          <p className="font-bold uppercase text-xs tracking-wide flex items-center gap-2">
            {configNotice.type === 'success' ? <Check size={16} /> : <AlertTriangle size={16} />}
            {configNotice.type === 'success' ? 'Cambios guardados' : 'Algo salió mal'}
          </p>
          <p className="text-sm mt-1">{configNotice.text}</p>
        </div>
      )}

      <div className="mb-8 border-b-2 border-black">
        {/* Mobile dropdown */}
        <div className="admin-tabs-mobile block md:hidden mb-3">
          <select
            className="w-full border-2 border-black p-3 font-bold uppercase"
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value as any)}
          >
            <option value="dashboard">Dashboard</option>
            <option value="events">Eventos</option>
            <option value="stands">Stands</option>
            <option value="cosplay">Cosplay</option>
            <option value="cosplayguest">🌟 Cosplay Invitados</option>
            <option value="karaoke">🎤 Karaoke</option>
            <option value="gallery">Galería Comunitaria</option>
            <option value="officialgallery">📸 Galería Oficial</option>
            <option value="giveaways">Sorteos</option>
            <option value="sponsors">Sponsors</option>
            <option value="users">Usuarios</option>
            <option value="config">Config</option>
          </select>
        </div>

        {/* Desktop tab bar */}
        <div className="admin-tabs-desktop hidden md:flex flex-wrap gap-1 overflow-x-auto scrollbar-hide">
          <TabButton id="dashboard" label="Dashboard" icon={Ghost} />
          <TabButton id="events" label="Eventos" icon={Calendar} />
          <TabButton id="stands" label="Stands" icon={Store} />
          <TabButton id="cosplay" label="Cosplay" icon={Trophy} />
          <TabButton id="cosplayguest" label="🌟 Invitados" icon={Star} />
          <TabButton id="karaoke" label="🎤 Karaoke" icon={Mic} />
          <TabButton id="gallery" label="👥 Comunitaria" icon={Image} />
          <TabButton id="officialgallery" label="📸 Oficial" icon={Sparkles} />
          <TabButton id="giveaways" label="Sorteos" icon={Gift} />
          <TabButton id="sponsors" label="Sponsors" icon={DollarSign} />
          <TabButton id="users" label="Usuarios" icon={Users} />
          <TabButton id="config" label="Config" icon={Upload} />
        </div>
      </div>

      {/* --- DASHBOARD --- */}
      {activeTab === 'dashboard' && stats && (
        <div className="space-y-8 animate-in fade-in">
           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             <MangaCard className="text-center">
                <div className="text-3xl font-display text-torami-red">{stats.users?.total || 0}</div>
                <div className="text-xs uppercase text-gray-500 font-bold">Usuarios</div>
             </MangaCard>
             <MangaCard className="text-center bg-yellow-50">
                <div className="text-3xl font-display">{stats.stands?.pending || 0}</div>
                <div className="text-xs uppercase text-gray-500 font-bold">Stands Pendientes</div>
             </MangaCard>
             <MangaCard className="text-center">
                <div className="text-3xl font-display">{stats.events?.total || 0}</div>
                <div className="text-xs uppercase text-gray-500 font-bold">Eventos</div>
             </MangaCard>
             <MangaCard className="text-center">
                <div className="text-3xl font-display">{stats.giveaways?.active || 0}</div>
                <div className="text-xs uppercase text-gray-500 font-bold">Sorteos Activos</div>
             </MangaCard>
           </div>

           {/* Cosplay Stats Row */}
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <MangaCard className={`text-center border-l-4 ${
               (stats.cosplay?.approved || 0) + (stats.cosplay?.pending || 0) >= (config.cosplayLimit || 20)
                 ? 'bg-red-50 border-l-red-600'
                 : (stats.cosplay?.approved || 0) + (stats.cosplay?.pending || 0) > ((config.cosplayLimit || 20) * 0.75)
                 ? 'bg-yellow-50 border-l-yellow-600'
                 : 'bg-green-50 border-l-green-600'
             }`}>
                <div className="text-3xl font-display">
                  {(stats.cosplay?.approved || 0) + (stats.cosplay?.pending || 0)}/{config.cosplayLimit || 20}
                </div>
                <div className="text-xs uppercase text-gray-500 font-bold">Cupos Cosplay</div>
                <div className="text-xs text-gray-600 mt-1">
                  {(config.cosplayLimit || 20) - ((stats.cosplay?.approved || 0) + (stats.cosplay?.pending || 0))} disponibles
                </div>
             </MangaCard>

             <MangaCard className="text-center bg-blue-50">
                <div className="text-3xl font-display text-blue-600">{stats.cosplay?.waitingList || 0}</div>
                <div className="text-xs uppercase text-gray-500 font-bold">Lista de Espera</div>
                <div className="text-xs text-gray-600 mt-1">
                  {stats.cosplay?.waitingList > 0 ? 'Recibirán email si se libera cupo' : 'Nadie en espera'}
                </div>
             </MangaCard>

             <MangaCard className="text-center">
                <div className="text-3xl font-display text-purple-600">{stats.cosplay?.total || 0}</div>
                <div className="text-xs uppercase text-gray-500 font-bold">Total Inscripciones</div>
                <div className="text-xs text-gray-600 mt-1">
                  Aprobados: {stats.cosplay?.approved || 0} | Rechazados: {stats.cosplay?.rejected || 0}
                </div>
             </MangaCard>
           </div>
           <div className="bg-white p-4 border-2 border-black shadow-manga flex flex-col">
              <h3 className="font-bold mb-4 uppercase">Asistencia por Evento</h3>
              <div className="grow min-h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[{name: 'Summer Ed.', as: 1200}, {name: 'Retro', as: 850}, {name: 'Winter', as: 1500}]}>
                    <XAxis dataKey="name" /> <YAxis /> <Tooltip /> <Bar dataKey="as" fill="#D70000" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
           </div>
        </div>
      )}

      {/* --- EVENTS CRUD --- */}
      {activeTab === 'events' && (
        <div className="animate-in fade-in">
            <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-0 mb-4">
                <h3 className="font-display text-xl sm:text-2xl">Listado de Eventos</h3>
                <Button onClick={() => setEditingEvent({ title: '', date: '', time: '', location: '', description: '', tags: [], isFeatured: false, rainCheck: false, images: [], isFree: true, ticketPrice: undefined, ticketLink: undefined })} className="text-sm sm:text-base">
                    <Plus size={18} className="mr-2 inline" /> Nuevo Evento
                </Button>
            </div>
            <div className="grid gap-4">
                {events.map(ev => (
                    <MangaCard key={ev.id} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="flex items-start gap-3 sm:gap-4 w-full md:w-auto">
                            <img src={ev.images[0] || 'https://via.placeholder.com/100'} alt={ev.title} className="w-12 h-12 sm:w-16 sm:h-16 object-cover border border-black shrink-0" />
                            <div className="grow min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <h4 className="font-bold text-base sm:text-lg break-all">{ev.title}</h4>
                                    {ev.isFeatured && <Badge color="blue">Destacado</Badge>}
                                    {ev.isPast && <Badge color="purple">Pasado</Badge>}
                                </div>
                                <div className="text-xs sm:text-sm text-gray-600 flex flex-col sm:flex-row gap-1 sm:gap-4 mt-1">
                                    <span className="whitespace-nowrap"><Calendar size={14} className="inline"/> {new Date(ev.date).toLocaleDateString('es-AR')}</span>
                                    <span className="break-all">{ev.location}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-2 w-full md:w-auto md:shrink-0">
                            <Button variant="secondary" className="px-2 sm:px-3 py-2 flex-1 md:flex-initial text-sm" onClick={() => {
                                // Convertir fecha ISO a DD/MM/YYYY para edición (usar UTC para evitar cambios de zona horaria)
                                const dateISO = new Date(ev.date);
                                const day = dateISO.getUTCDate().toString().padStart(2, '0');
                                const month = (dateISO.getUTCMonth() + 1).toString().padStart(2, '0');
                                const year = dateISO.getUTCFullYear();
                                const dateFormatted = `${day}/${month}/${year}`;
                                setEditingEvent({...ev, date: dateFormatted});
                            }}><Edit size={16}/></Button>
                            <Button variant="outline" className="px-2 sm:px-3 py-2 flex-1 md:flex-initial text-red-600 border-red-600 hover:bg-red-600 text-sm" onClick={() => handleDeleteEvent(ev.id)}><Trash2 size={16}/></Button>
                        </div>
                    </MangaCard>
                ))}
            </div>
        </div>
      )}

      {/* --- STANDS LIST --- */}
      {activeTab === 'stands' && (
        <div className="animate-in fade-in">
          {/* Cards para móvil y desktop */}
          <div className="space-y-3">
            {stands.map(stand => (
              <div key={stand.id} className="border-2 border-black bg-white shadow-manga p-4">
                <div className="flex flex-col gap-3">
                  {/* Header con marca y badge de estado */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-lg truncate">{stand.brandName}</h4>
                      <p className="text-sm text-gray-600">{stand.type}</p>
                    </div>
                    <Badge color={stand.status === 'PENDIENTE' ? 'blue' : stand.status === 'APROBADA' ? 'red' : 'purple'}>
                      {stand.status}
                    </Badge>
                  </div>

                  {/* Info del evento */}
                  <div className="text-sm">
                    {stand.event ? (
                      <div>
                        <span className="font-medium">📅 {stand.event.title}</span>
                        <span className="text-gray-500 ml-2">
                          {new Date(stand.event.date).toLocaleDateString('es-AR')}
                        </span>
                      </div>
                    ) : (
                      <span className="text-red-500 italic">Sin evento asignado</span>
                    )}
                  </div>

                  {/* Contacto */}
                  <div className="text-sm">
                    <p className="font-medium">{stand.contactName}</p>
                    <p className="text-gray-600 text-xs">{stand.email}</p>
                    <p className="font-mono text-xs text-gray-600">{stand.phone}</p>
                  </div>

                  {/* Acciones */}
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200">
                    <button
                      onClick={() => setViewStand(stand)}
                      className="flex-1 sm:flex-none bg-gray-100 text-gray-700 px-4 py-2 rounded hover:bg-gray-200 border border-gray-300 flex items-center justify-center gap-2 text-sm font-bold"
                    >
                      <Eye size={16} /> Ver Detalle
                    </button>
                    <button
                      onClick={() => {
                        setChatStand(stand);
                      }}
                      className="flex-1 sm:flex-none bg-blue-50 text-blue-600 px-4 py-2 rounded hover:bg-blue-100 border border-blue-200 flex items-center justify-center gap-2 text-sm font-bold"
                    >
                      <MessageCircle size={16} /> Chat
                    </button>
                    {stand.status === 'PENDIENTE' && (
                      <>
                        <button
                          onClick={() => handleStandStatus(stand.id, 'Aprobada')}
                          className="text-green-600 bg-green-50 px-3 py-2 rounded hover:bg-green-100 border border-green-200 flex items-center gap-1 text-sm font-bold"
                        >
                          <Check size={16}/> Aprobar
                        </button>
                        <button
                          onClick={() => { setViewStand(stand); setIsRejectingStand(true); }}
                          className="text-red-600 bg-red-50 px-3 py-2 rounded hover:bg-red-100 border border-red-200 flex items-center gap-1 text-sm font-bold"
                        >
                          <X size={16}/> Rechazar
                        </button>
                      </>
                    )}
                    {(stand.status === 'APROBADA' || stand.status === 'RECHAZADA') && (
                      <button
                        onClick={() => {
                          setDeletingStand(stand);
                          setShowDeleteStandConfirm(true);
                        }}
                        className="bg-red-100 text-red-700 px-3 py-2 rounded hover:bg-red-200 border border-red-300 flex items-center gap-1 text-sm font-bold"
                      >
                        <Trash2 size={16} /> Eliminar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {stands.length === 0 && (
              <div className="border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center text-gray-500 italic">
                No hay solicitudes de stands aún.
              </div>
            )}
          </div>

          {/* Pagination Controls */}
          <PaginationControls
            page={pagination.stands.page}
            totalPages={pagination.stands.totalPages}
            total={pagination.stands.total}
            limit={pagination.stands.limit}
            onPageChange={(page) => handlePageChange('stands', page)}
            onLimitChange={(limit) => handleLimitChange('stands', limit)}
          />
        </div>
      )}

      {/* --- COSPLAY LIST --- */}
      {activeTab === 'cosplay' && (
        <div className="animate-in fade-in">
           <div className="flex justify-between mb-4">
                <h3 className="font-display text-xl sm:text-2xl flex items-center gap-2">
                  <Trophy size={24} className="text-purple-600" />
                  Gestión de Cosplay
                </h3>
           </div>

           {/* Stats de cosplay */}
           <div className="grid grid-cols-3 gap-4 mb-6">
             <MangaCard className="text-center bg-yellow-50">
               <div className="text-2xl font-display text-yellow-600">
                 {cosplayers.filter(c => c.status.toUpperCase() === 'INSCRIPTO').length}
               </div>
               <div className="text-xs uppercase text-gray-500 font-bold">Inscriptos</div>
             </MangaCard>
             <MangaCard className="text-center bg-green-50">
               <div className="text-2xl font-display text-green-600">
                 {cosplayers.filter(c => c.status.toUpperCase() === 'CONFIRMADO').length}
               </div>
               <div className="text-xs uppercase text-gray-500 font-bold">Confirmados</div>
             </MangaCard>
             <MangaCard className="text-center bg-red-50">
               <div className="text-2xl font-display text-red-600">
                 {cosplayers.filter(c => c.status.toUpperCase() === 'RECHAZADO').length}
               </div>
               <div className="text-xs uppercase text-gray-500 font-bold">Rechazados</div>
             </MangaCard>
           </div>

           {/* Cards para móvil y desktop */}
           <div className="space-y-3">
             {cosplayers.map(cos => (
               <div key={cos.id} className="border-2 border-black bg-white shadow-manga p-4">
                 <div className="flex flex-col gap-3">
                   {/* Personaje y Serie */}
                   <div>
                     <h4 className="font-bold text-lg truncate">{cos.characterName}</h4>
                     <p className="text-sm text-gray-600 truncate">{cos.seriesName}</p>
                   </div>

                   {/* Info del participante */}
                   <div className="text-sm">
                     <p className="font-medium">{cos.participantName}</p>
                     {cos.nickname && (
                       <p className="text-xs text-gray-500 italic">"{cos.nickname}"</p>
                     )}
                   </div>

                   {/* Evento */}
                   <div className="text-sm">
                     {cos.event ? (
                       <div>
                         <span className="font-medium">📅 {cos.event.title}</span>
                         <span className="text-gray-500 ml-2">
                           {new Date(cos.event.date).toLocaleDateString('es-AR')}
                         </span>
                       </div>
                     ) : (
                       <span className="text-red-500 italic">Sin evento</span>
                     )}
                   </div>

                   {/* Categoría y Estado */}
                   <div className="flex flex-wrap gap-2 items-center">
                     <Badge color="blue">{cos.category}</Badge>
                     <Badge color={cos.status === 'Inscripto' ? 'yellow' : cos.status === 'Confirmado' ? 'green' : 'red'}>
                       {cos.status}
                     </Badge>
                   </div>

                   {/* Botones de acción */}
                   <div className="flex flex-wrap gap-2">
                     <button
                       onClick={() => handleViewCosplayDetails(cos)}
                       className="bg-gray-100 text-gray-700 px-4 py-2 rounded hover:bg-gray-200 border border-gray-300 flex items-center justify-center gap-2 text-sm font-bold"
                     >
                       <Eye size={16} /> Ver Detalles
                     </button>

                     {/* Mostrar botón eliminar solo si está Confirmado o Rechazado (case-insensitive) */}
                     {(cos.status.toUpperCase() === 'CONFIRMADO' || cos.status.toUpperCase() === 'RECHAZADO') && (
                       <button
                         onClick={() => {
                           setDeletingCosplay(cos);
                           setShowDeleteCosplayConfirm(true);
                         }}
                         className="bg-red-100 text-red-700 px-4 py-2 rounded hover:bg-red-200 border border-red-300 flex items-center justify-center gap-2 text-sm font-bold"
                       >
                         <Trash2 size={16} /> Eliminar
                       </button>
                     )}
                   </div>
                 </div>
               </div>
             ))}

             {cosplayers.length === 0 && (
               <div className="border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center text-gray-500 italic">
                 No hay inscriptos de cosplay aún.
               </div>
             )}
           </div>

           {/* Pagination Controls */}
           <PaginationControls
             page={pagination.cosplay.page}
             totalPages={pagination.cosplay.totalPages}
             total={pagination.cosplay.total}
             limit={pagination.cosplay.limit}
             onPageChange={(page) => handlePageChange('cosplay', page)}
             onLimitChange={(limit) => handleLimitChange('cosplay', limit)}
           />
        </div>
      )}

      {/* --- COSPLAY INVITADOS --- */}
      {activeTab === 'cosplayguest' && (
        <div className="animate-in fade-in">
          <div className="flex justify-between mb-4">
            <h3 className="font-display text-xl sm:text-2xl flex items-center gap-2">
              <Star size={24} className="text-yellow-500 fill-current" />
              Gestión de Cosplay Invitados
            </h3>
          </div>

          {/* Stats de cosplay invitados */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <MangaCard className="p-4 text-center bg-yellow-50">
              <div className="text-2xl font-display text-yellow-600">
                {cosplayGuests.filter(g => g.status.toUpperCase() === 'INSCRIPTO').length}
              </div>
              <div className="text-xs uppercase text-gray-500 font-bold">Inscriptos</div>
            </MangaCard>
            <MangaCard className="p-4 text-center bg-green-50">
              <div className="text-2xl font-display text-green-600">
                {cosplayGuests.filter(g => g.status.toUpperCase() === 'CONFIRMADO').length}
              </div>
              <div className="text-xs uppercase text-gray-500 font-bold">Confirmados</div>
            </MangaCard>
            <MangaCard className="p-4 text-center bg-red-50">
              <div className="text-2xl font-display text-red-600">
                {cosplayGuests.filter(g => g.status.toUpperCase() === 'RECHAZADO').length}
              </div>
              <div className="text-xs uppercase text-gray-500 font-bold">Rechazados</div>
            </MangaCard>
          </div>

          {/* Cards para móvil y desktop */}
          <div className="space-y-3">
             {cosplayGuests.map(guest => (
               <div key={guest.id} className="border-2 border-black bg-white shadow-manga p-4">
                 <div className="flex gap-4">
                   {/* Número asignado - destacado */}
                   <div className="shrink-0">
                     <div className="flex items-center justify-center w-14 h-14 bg-yellow-400 border-2 border-black font-bold text-2xl">
                       {guest.assignedNumber}
                     </div>
                   </div>

                   {/* Contenido principal */}
                   <div className="flex-1 min-w-0">
                     {/* Personaje y Serie */}
                     <div className="mb-2">
                       <h4 className="font-bold text-lg truncate">{guest.characterName}</h4>
                       <p className="text-sm text-gray-600 truncate">{guest.seriesName}</p>
                     </div>

                     {/* Info del participante */}
                     <div className="mb-2">
                       <p className="text-sm font-medium">{guest.participantName}</p>
                       {guest.nickname && (
                         <p className="text-xs text-gray-500 italic">"{guest.nickname}"</p>
                       )}
                     </div>

                     {/* Evento, categoría y estado en una fila */}
                     <div className="flex flex-wrap gap-2 items-center mb-3 text-sm">
                       <span className="text-gray-700">
                         📅 {guest.event?.title || 'Sin evento'}
                       </span>
                       <Badge color="blue">{guest.category}</Badge>
                       <Badge color={guest.status === 'Inscripto' ? 'yellow' : guest.status === 'Confirmado' ? 'green' : 'red'}>
                         {guest.status}
                       </Badge>
                     </div>

                     {/* Botones de acción */}
                     <div className="flex flex-wrap gap-2">
                       <button
                         onClick={() => handleViewCosplayDetails(guest)}
                         className="bg-gray-100 text-gray-700 px-4 py-2 rounded hover:bg-gray-200 border border-gray-300 flex items-center justify-center gap-2 text-sm font-bold"
                       >
                         <Eye size={16} /> Ver Detalles
                       </button>

                       {/* Mostrar botón eliminar solo si está Confirmado o Rechazado (case-insensitive) */}
                       {(guest.status.toUpperCase() === 'CONFIRMADO' || guest.status.toUpperCase() === 'RECHAZADO') && (
                         <button
                           onClick={() => {
                             setDeletingCosplayGuest(guest);
                             setShowDeleteCosplayGuestConfirm(true);
                           }}
                           className="bg-red-100 text-red-700 px-4 py-2 rounded hover:bg-red-200 border border-red-300 flex items-center justify-center gap-2 text-sm font-bold"
                         >
                           <Trash2 size={16} /> Eliminar
                         </button>
                       )}
                     </div>
                   </div>
                 </div>
               </div>
             ))}

             {cosplayGuests.length === 0 && (
              <div className="border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center text-gray-500 italic">
                No hay invitados especiales registrados aún.
              </div>
            )}
          </div>

          {/* Pagination Controls */}
          <PaginationControls
            page={pagination.cosplayguest.page}
            totalPages={pagination.cosplayguest.totalPages}
            total={pagination.cosplayguest.total}
            limit={pagination.cosplayguest.limit}
            onPageChange={(page) => handlePageChange('cosplayguest', page)}
            onLimitChange={(limit) => handleLimitChange('cosplayguest', limit)}
          />
        </div>
      )}

      {/* --- KARAOKE MANAGEMENT --- */}
      {activeTab === 'karaoke' && (
        <div className="animate-in fade-in">
          <div className="flex justify-between mb-4">
            <h3 className="font-display text-xl sm:text-2xl flex items-center gap-2">
              <Mic size={24} className="text-purple-600" />
              Gestión de Karaoke
            </h3>
          </div>

          {/* Stats de karaoke */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <MangaCard className="text-center bg-yellow-50">
              <div className="text-2xl font-display text-yellow-600">
                {karaokeList.filter(k => k.status === 'Pendiente' || k.status === 'PENDIENTE').length}
              </div>
              <div className="text-xs uppercase text-gray-500 font-bold">Pendientes</div>
            </MangaCard>
            <MangaCard className="text-center bg-green-50">
              <div className="text-2xl font-display text-green-600">
                {karaokeList.filter(k => k.status === 'Aprobado' || k.status === 'APROBADO').length}
              </div>
              <div className="text-xs uppercase text-gray-500 font-bold">Aprobados</div>
            </MangaCard>
            <MangaCard className="text-center bg-red-50">
              <div className="text-2xl font-display text-red-600">
                {karaokeList.filter(k => k.status === 'Rechazado' || k.status === 'RECHAZADO').length}
              </div>
              <div className="text-xs uppercase text-gray-500 font-bold">Rechazados</div>
            </MangaCard>
          </div>

          {/* Lista de inscripciones */}
          <div className="space-y-3">
            {karaokeList.map(karaoke => (
              <div key={karaoke.id} className="border-2 border-black bg-white shadow-manga p-4">
                <div className="flex gap-4">
                  {/* Número asignado si existe */}
                  <div className="shrink-0">
                    <div className={`flex items-center justify-center w-14 h-14 border-2 border-black font-bold text-2xl ${
                      karaoke.assignedNumber ? 'bg-green-400' : 'bg-gray-200'
                    }`}>
                      {karaoke.assignedNumber || '?'}
                    </div>
                  </div>

                  {/* Contenido */}
                  <div className="flex-1 min-w-0">
                    {/* Nombre y canción */}
                    <div className="mb-2">
                      <h4 className="font-bold text-lg">{karaoke.fullName}</h4>
                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        <div className="text-xs text-gray-600">
                          <p className="flex items-center gap-1">
                            <Music size={14} /> Opciones:
                          </p>
                          <ul className="ml-5 list-disc">
                            {[karaoke.songName, karaoke.songName2, karaoke.songName3]
                              .filter(Boolean)
                              .map((song, idx) => (
                                <li key={`${karaoke.id}-song-${idx}`}>{song}</li>
                              ))}
                          </ul>
                        </div>
                      </p>
                    </div>

                    {/* Contacto */}
                    <div className="flex flex-wrap gap-3 text-sm mb-2">
                      <a
                        href={`https://instagram.com/${karaoke.instagram.replace('@', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-pink-600 hover:underline flex items-center gap-1"
                      >
                        <Instagram size={14} /> {karaoke.instagram}
                      </a>
                      <a href={`mailto:${karaoke.email}`} className="text-blue-600 hover:underline">
                        {karaoke.email}
                      </a>
                      <a href={`https://wa.me/${karaoke.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline flex items-center gap-1">
                        <Phone size={14} /> {karaoke.whatsapp}
                      </a>
                    </div>

                    {/* Evento y estado */}
                    <div className="flex flex-wrap gap-2 items-center mb-3 text-sm">
                      <span className="text-gray-700">
                        📅 {karaoke.event?.title || 'Sin evento'}
                      </span>
                      <Badge color={
                        (karaoke.status === 'Pendiente' || karaoke.status === 'PENDIENTE') ? 'yellow' :
                        (karaoke.status === 'Aprobado' || karaoke.status === 'APROBADO') ? 'green' : 'red'
                      }>
                        {karaoke.status}
                      </Badge>
                    </div>

                    {/* Botones de acción */}
                    <div className="flex flex-wrap gap-2">
                      {(karaoke.status === 'Pendiente' || karaoke.status === 'PENDIENTE') && (
                        <>
                          <button
                            onClick={async () => {
                              await updateKaraokeStatus(karaoke.id, 'APROBADO');
                              loadTabData('karaoke');
                            }}
                            className="bg-green-100 text-green-700 px-4 py-2 rounded hover:bg-green-200 border border-green-300 flex items-center gap-2 text-sm font-bold"
                          >
                            <Check size={16} /> Aprobar
                          </button>
                          <button
                            onClick={async () => {
                              await updateKaraokeStatus(karaoke.id, 'RECHAZADO');
                              loadTabData('karaoke');
                            }}
                            className="bg-red-100 text-red-700 px-4 py-2 rounded hover:bg-red-200 border border-red-300 flex items-center gap-2 text-sm font-bold"
                          >
                            <X size={16} /> Rechazar
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => {
                          setDeletingKaraoke(karaoke);
                          setShowDeleteKaraokeConfirm(true);
                        }}
                        className="bg-gray-100 text-gray-700 px-4 py-2 rounded hover:bg-gray-200 border border-gray-300 flex items-center gap-2 text-sm font-bold"
                      >
                        <Trash2 size={16} /> Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {karaokeList.length === 0 && (
              <div className="border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center text-gray-500 italic">
                No hay inscripciones de karaoke aún.
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- GALLERY MODERATION (COMMUNITY) --- */}
      {activeTab === 'gallery' && (
          <div className="animate-in fade-in">
              <h3 className="font-display text-xl sm:text-2xl mb-4">👥 Moderación de Galería Comunitaria</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-4">
                  {gallery.map(img => (
                      <div
                        key={img.id}
                        onClick={() => setSelectedPhoto(img)}
                        className={`relative group border-2 ${
                            img.status === 'APPROVED' ? 'border-green-500' :
                            img.status === 'REJECTED' ? 'border-red-500' : 'border-yellow-400'
                        } p-1 cursor-pointer hover:shadow-manga transition-all`}
                      >
                          <img src={img.url} alt="Gallery" className="w-full h-40 object-cover" />
                          <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                               <ZoomIn className="text-white w-8 h-8 drop-shadow-lg" />
                          </div>
                          <div className={`absolute top-2 right-2 px-2 py-1 text-xs font-bold text-white ${
                              img.status === 'APPROVED' ? 'bg-green-600' :
                              img.status === 'REJECTED' ? 'bg-red-600' : 'bg-yellow-600'
                          }`}>
                              {img.status === 'APPROVED' ? 'Aprobada' : img.status === 'REJECTED' ? 'Rechazada' : 'Pendiente'}
                          </div>
                          {img.feedback && (
                              <div className="absolute bottom-2 left-2 right-2 bg-red-100 text-red-800 text-xs p-1 border border-red-300 truncate">
                                  Feed: {img.feedback}
                              </div>
                          )}
                      </div>
                  ))}
              </div>
          </div>
      )}

      {/* --- OFFICIAL GALLERY --- */}
      {activeTab === 'officialgallery' && (
          <div className="animate-in fade-in">
              <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-0 mb-4">
                  <h3 className="font-display text-xl sm:text-2xl">📸 Galería Oficial</h3>
                  <Button onClick={() => setShowOfficialUpload(true)} className="text-sm sm:text-base">
                      <Plus size={18} className="mr-2 inline" /> Subir Foto Oficial
                  </Button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-4">
                  {officialGallery.map(img => (
                      <div
                        key={img.id}
                        className="relative group border-2 border-torami-red p-1 hover:shadow-manga transition-all"
                      >
                          <img src={img.url} alt="Official Gallery" className="w-full h-40 object-cover" />
                          <div className="absolute top-2 right-2 px-2 py-1 text-xs font-bold text-white bg-torami-red">
                              Oficial
                          </div>
                          <button
                            onClick={() => handleDeleteOfficialPhoto(img.id)}
                            className="absolute bottom-2 right-2 bg-red-600 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 size={16} />
                          </button>
                      </div>
                  ))}
                  {officialGallery.length === 0 && (
                    <div className="col-span-full text-center py-10 text-gray-500">
                      No hay fotos oficiales aún. Hacé clic en "Subir Foto Oficial" para agregar.
                    </div>
                  )}
              </div>
          </div>
      )}

      {/* --- SPONSORS CRUD --- */}
      {activeTab === 'sponsors' && (
          <div className="animate-in fade-in">
            <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-0 mb-4">
                <h3 className="font-display text-xl sm:text-2xl">Sponsors</h3>
                <Button onClick={() => setEditingSponsor({ name: '', logoUrl: '', category: 'Colaborador', link: '', active: true })} className="text-sm sm:text-base">
                    <Plus size={18} className="mr-2 inline" /> Nuevo Sponsor
                </Button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
                {sponsors.map(sp => (
                    <MangaCard key={sp.id} className="flex items-center gap-3 sm:gap-4">
                        <img src={sp.logoUrl} alt={sp.name} className="w-12 h-12 sm:w-16 sm:h-16 object-contain border border-gray-200 shrink-0" />
                        <div className="grow min-w-0">
                            <h4 className="font-bold text-sm sm:text-base break-all">{sp.name}</h4>
                            <div className="text-xs text-gray-500">{sp.category}</div>
                            <Badge color={sp.active ? 'red' : 'purple'}>{sp.active ? 'Activo' : 'Inactivo'}</Badge>
                        </div>
                        <div className="flex flex-row sm:flex-col gap-2 sm:gap-1 shrink-0">
                            <button onClick={() => setEditingSponsor(sp)} className="text-blue-600 p-1"><Edit size={16}/></button>
                            <button onClick={() => handleDeleteSponsor(sp.id)} className="text-red-600 p-1"><Trash2 size={16}/></button>
                        </div>
                    </MangaCard>
                ))}
            </div>
          </div>
      )}

      {/* --- GIVEAWAYS CRUD --- */}
      {activeTab === 'giveaways' && (
          <div className="animate-in fade-in">
            <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-0 mb-4">
                <h3 className="font-display text-xl sm:text-2xl">Sorteos</h3>
                <Button onClick={() => setEditingGiveaway({ title: '', description: '', prize: '', startDate: '', endDate: '', status: 'Activo', images: [] })} className="text-sm sm:text-base">
                    <Plus size={18} className="mr-2 inline" /> Nuevo Sorteo
                </Button>
            </div>
            <div className="grid gap-4">
                {giveaways.map(g => (
                    <MangaCard key={g.id}>
                        <div className="flex flex-col sm:flex-row justify-between gap-4">
                            <div className="flex gap-3 sm:gap-4">
                                {g.images && g.images.length > 0 && (
                                   <img src={g.images[0]} alt={g.title} className="w-16 h-16 sm:w-20 sm:h-20 object-cover border border-black shrink-0" />
                                )}
                                <div className="grow min-w-0">
                                    <h4 className="font-bold text-base sm:text-lg break-all">{g.title}</h4>
                                    <p className="text-xs sm:text-sm text-gray-600 break-all">Premio: {g.prize}</p>
                                    <div className="mt-2 text-xs">Participantes: {g.participantIds.length}</div>
                                </div>
                            </div>
                            <div className="flex sm:flex-col items-start sm:items-end justify-between sm:justify-start gap-3 sm:gap-2">
                                <Badge color={g.status === 'Activo' ? 'red' : 'purple'}>{g.status}</Badge>
                                <div className="flex gap-2">
                                    <button onClick={() => setEditingGiveaway(g)} className="text-blue-600 hover:bg-blue-50 p-1 rounded"><Edit size={16}/></button>
                                    <button onClick={() => handleDeleteGiveaway(g.id)} className="text-red-600 hover:bg-red-50 p-1 rounded"><Trash2 size={16}/></button>
                                </div>
                            </div>
                        </div>
                    </MangaCard>
                ))}
            </div>
          </div>
      )}

      {/* --- USERS MANAGEMENT --- */}
      {activeTab === 'users' && (
          <div className="animate-in fade-in">
            <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-0 mb-4">
                <h3 className="font-display text-xl sm:text-2xl">Gestión de Usuarios</h3>
            </div>

            {users.length === 0 && (
              <div className="text-center py-10 text-gray-500 italic">
                Cargando usuarios...
              </div>
            )}

            <div className="space-y-3">
              {users.map(u => (
                <div key={u.id} className="border-2 border-black bg-white shadow-manga p-4">
                  <div className="flex gap-4">
                    {/* Avatar/Icon */}
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center w-14 h-14 bg-gradient-to-br from-torami-red to-red-700 border-2 border-black text-white font-bold text-xl rounded-full">
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="mb-2">
                        <h4 className="font-bold text-lg truncate">{u.name}</h4>
                        <p className="text-sm text-gray-600 truncate">{u.email}</p>
                      </div>

                      {/* Info Row */}
                      <div className="flex flex-wrap gap-2 items-center mb-3 text-sm">
                        <Badge color={u.role === 'SUPER_ADMIN' ? 'red' : u.role === 'ADMIN' ? 'blue' : 'purple'}>
                          {u.role}
                        </Badge>

                        {u.entryAuthorized ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs font-bold rounded">
                            <Check size={12} /> Entrada Autorizada
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 text-xs font-bold rounded">
                            <X size={12} /> Sin Autorización
                          </span>
                        )}

                        <span className="text-xs text-gray-500">
                          📅 {u.createdAt ? new Date(u.createdAt).toLocaleDateString('es-AR') : '-'}
                        </span>
                      </div>

                      {/* WhatsApp */}
                      {u.whatsapp && (
                        <div className="mb-3">
                          <a
                            href={`https://wa.me/${u.whatsapp.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 text-sm font-medium"
                          >
                            <Phone size={14} />
                            {u.whatsapp}
                          </a>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => setEditingUser(u)}
                          className="flex-1 sm:flex-none bg-blue-50 text-blue-600 px-4 py-2 rounded hover:bg-blue-100 border border-blue-200 flex items-center justify-center gap-2 text-sm font-bold"
                        >
                          <Edit size={16} /> Editar
                        </button>

                        <button
                          onClick={() => {
                            updateUser(u.id, { entryAuthorized: !u.entryAuthorized }).then(() => refreshCurrentTab());
                          }}
                          className={`flex-1 sm:flex-none px-4 py-2 rounded border flex items-center justify-center gap-2 text-sm font-bold ${
                            u.entryAuthorized
                              ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'
                              : 'bg-green-50 text-green-600 border-green-200 hover:bg-green-100'
                          }`}
                        >
                          {u.entryAuthorized ? (
                            <>
                              <X size={16} /> Revocar
                            </>
                          ) : (
                            <>
                              <Check size={16} /> Autorizar
                            </>
                          )}
                        </button>

                        {user?.role === 'SUPER_ADMIN' && u.id !== user.id && (
                          <button
                            onClick={() => {
                              setDeletingUser(u);
                              setShowDeleteUserConfirm(true);
                            }}
                            className="flex-1 sm:flex-none bg-red-50 text-red-600 px-4 py-2 rounded hover:bg-red-100 border border-red-200 flex items-center justify-center gap-2 text-sm font-bold"
                          >
                            <Trash2 size={16} /> Eliminar
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            <PaginationControls
              page={pagination.users.page}
              totalPages={pagination.users.totalPages}
              total={pagination.users.total}
              limit={pagination.users.limit}
              onPageChange={(page) => handlePageChange('users', page)}
              onLimitChange={(limit) => handleLimitChange('users', limit)}
            />
          </div>
      )}

      {/* --- CONFIG --- */}
      {activeTab === 'config' && (
         <div className="animate-in fade-in pb-12 grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
                <MangaCard className="border-t-4 border-t-torami-red">
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                        <Calendar size={20} /> Portada Home (Hero)
                    </h3>
                    <p className="text-xs text-gray-500 mb-4">Edita los textos principales que aparecen al entrar a la web.</p>
                    <div className="space-y-4">
                        <Input 
                            label="Título Principal" 
                            name="heroTitle" 
                            value={config.heroTitle} 
                            onChange={handleConfigChange} 
                            placeholder="Torami Fest" 
                        />
                        <Input 
                            label="Eslogan / Subtítulo" 
                            name="heroSubtitle" 
                            value={config.heroSubtitle} 
                            onChange={handleConfigChange} 
                            placeholder="Evento de anime..." 
                        />
                        <Input 
                            label="Texto de Fecha/Lugar" 
                            name="heroDateText" 
                            value={config.heroDateText} 
                            onChange={handleConfigChange} 
                            placeholder="28/03/2026 – Artigas 202" 
                        />
                    </div>
                </MangaCard>
                
                <MangaCard>
                    <h3 className="font-bold text-lg mb-4">Galería del Home</h3>
                    <p className="text-xs text-gray-500 mb-4">Estas 6 imágenes se muestran en la pantalla principal debajo del botón "Quiero un Stand".</p>
                    <MediaManager
                        media={config.homeGalleryImages || []}
                        onChange={(imgs) => {
                            setConfig({...config, homeGalleryImages: imgs});
                        }}
                        max={6}
                        label="Imágenes (Max 6)"
                        useCloudinary={true}
                    />
                    {config.homeGalleryImages && config.homeGalleryImages.length > 0 && (
                        <div className="mt-2 text-xs text-green-600 font-bold">
                            ✓ {config.homeGalleryImages.length} imagen(es) cargada(s) - Click en "Guardar Cambios Globales" para persistir
                        </div>
                    )}
                </MangaCard>

                {/* Control de Inscripciones */}
                <MangaCard className="border-t-4 border-t-purple-600">
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                        <AlertTriangle size={20} className="text-purple-600" /> Control de Inscripciones
                    </h3>
                    <p className="text-xs text-gray-500 mb-4">Abre o cierra manualmente las inscripciones. Cuando están cerradas, los usuarios ven un mensaje de "cupo completo".</p>

                    {/* Cosplay Contest */}
                    <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 mb-3 rounded">
                        <div>
                            <span className="font-bold block">Cosplay Concurso</span>
                            <span className="text-xs text-gray-500">
                                {config.cosplayInscripcionesAbiertas !== false ? 'Inscripciones abiertas' : 'Inscripciones cerradas'}
                            </span>
                        </div>
                        <button
                            onClick={() => setConfig({...config, cosplayInscripcionesAbiertas: !config.cosplayInscripcionesAbiertas})}
                            className={`relative w-14 h-8 rounded-full transition-colors duration-300 ${config.cosplayInscripcionesAbiertas !== false ? 'bg-green-500' : 'bg-red-400'}`}
                        >
                            <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300 ${config.cosplayInscripcionesAbiertas !== false ? 'translate-x-6' : ''}`}></div>
                        </button>
                    </div>

                    {/* Cosplay Guest */}
                    <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 mb-3 rounded">
                        <div>
                            <span className="font-bold block">Cosplay Invitados</span>
                            <span className="text-xs text-gray-500">
                                {config.cosplayGuestInscripcionesAbiertas !== false ? 'Inscripciones abiertas' : 'Inscripciones cerradas'}
                            </span>
                        </div>
                        <button
                            onClick={() => setConfig({...config, cosplayGuestInscripcionesAbiertas: !config.cosplayGuestInscripcionesAbiertas})}
                            className={`relative w-14 h-8 rounded-full transition-colors duration-300 ${config.cosplayGuestInscripcionesAbiertas !== false ? 'bg-green-500' : 'bg-red-400'}`}
                        >
                            <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300 ${config.cosplayGuestInscripcionesAbiertas !== false ? 'translate-x-6' : ''}`}></div>
                        </button>
                    </div>

                    {/* Stands */}
                    <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 mb-3 rounded">
                        <div>
                            <span className="font-bold block">Stands / Emprendedores</span>
                            <span className="text-xs text-gray-500">
                                {config.standsInscripcionesAbiertas !== false ? 'Inscripciones abiertas' : 'Inscripciones cerradas'}
                            </span>
                        </div>
                        <button
                            onClick={() => setConfig({...config, standsInscripcionesAbiertas: !config.standsInscripcionesAbiertas})}
                            className={`relative w-14 h-8 rounded-full transition-colors duration-300 ${config.standsInscripcionesAbiertas !== false ? 'bg-green-500' : 'bg-red-400'}`}
                        >
                            <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300 ${config.standsInscripcionesAbiertas !== false ? 'translate-x-6' : ''}`}></div>
                        </button>
                    </div>

                    {/* Karaoke */}
                    <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded">
                        <div>
                            <span className="font-bold block">Karaoke</span>
                            <span className="text-xs text-gray-500">
                                {config.karaokeInscripcionesAbiertas !== false ? 'Inscripciones abiertas' : 'Inscripciones cerradas'}
                            </span>
                        </div>
                        <button
                            onClick={() => setConfig({...config, karaokeInscripcionesAbiertas: !config.karaokeInscripcionesAbiertas})}
                            className={`relative w-14 h-8 rounded-full transition-colors duration-300 ${config.karaokeInscripcionesAbiertas !== false ? 'bg-green-500' : 'bg-red-400'}`}
                        >
                            <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300 ${config.karaokeInscripcionesAbiertas !== false ? 'translate-x-6' : ''}`}></div>
                        </button>
                    </div>

                    <p className="text-xs text-yellow-600 mt-3 font-medium">
                        Recordá hacer click en "Guardar Cambios Globales" para aplicar los cambios.
                    </p>
                </MangaCard>
            </div>

            <div className="space-y-6">
                <MangaCard>
                  <h3 className="font-bold text-lg mb-4">Donaciones y Pagos</h3>
                  <div className="flex items-center justify-between mb-6 p-4 bg-gray-50 border border-gray-200">
                    <div>
                      <span className="font-bold block">Habilitar Donaciones</span>
                      {isTogglingDonations && (
                        <span className="text-xs text-gray-500 italic animate-pulse">
                          {config.donationsEnabled ? 'Desactivando...' : 'Activando...'}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={handleConfigToggle}
                      disabled={isTogglingDonations}
                      className={`relative w-14 h-8 rounded-full transition-colors duration-300 ${config.donationsEnabled ? 'bg-green-500' : 'bg-gray-300'} ${isTogglingDonations ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                       <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300 ${config.donationsEnabled ? 'translate-x-6' : ''} ${isTogglingDonations ? 'animate-pulse' : ''}`}></div>
                    </button>
                  </div>

                  {!config.donationsEnabled && (
                    <div className="mb-6 p-4 bg-blue-50 border-l-4 border-l-blue-500 text-sm">
                      <p className="font-bold text-blue-800 mb-2">Propósito de las Donaciones</p>
                      <p className="text-blue-700">
                        Lo recaudado en cada festival o encuentro se donará a entidades benéficas.
                        Por ejemplo: veterinarios, comedores comunitarios, personas que necesitan remedios,
                        o lugares y personas que necesiten ayuda. Aquí se edita lo que se verá en la parte
                        de donaciones cuando esté activada.
                      </p>
                    </div>
                  )}

                  <div className="bg-blue-50 border-l-4 border-l-blue-500 p-4 mb-6 text-sm">
                    <p className="font-bold text-blue-800 mb-2">ℹ️ Datos Bancarios Fijos</p>
                    <p className="text-blue-700 text-xs">
                      Los datos bancarios (CBU, Alias, QR) están configurados de forma fija en el código.
                      Aquí solo podrás editar el mensaje y la causa de la campaña actual.
                    </p>
                  </div>

                  <div className="space-y-4">
                      <div className="space-y-1 mb-4">
                        <h4 className="font-bold text-md">Campaña de Donación Actual</h4>
                        <p className="text-xs text-gray-600">
                          Personaliza el mensaje y la causa de la campaña de donación activa.
                          Esto se mostrará en la página /donaciones.
                        </p>
                      </div>

                      <Input
                        label="Título de la Campaña"
                        name="donationTitle"
                        value={config.donationTitle || ''}
                        onChange={handleConfigChange}
                        placeholder="Ej: Donaciones a Caridad"
                      />

                      <div>
                        <label className="block text-sm font-bold mb-1 uppercase">Descripción de la Campaña</label>
                        <textarea
                          name="donationDescription"
                          rows={5}
                          className="w-full border-2 border-black p-3 focus:outline-none focus:shadow-manga"
                          value={config.donationDescription || ''}
                          onChange={handleConfigChange}
                          placeholder="Describe a dónde van las donaciones en esta ocasión..."
                        />
                      </div>

                      <Input
                        label="Imagen de la Campaña (URL - Opcional)"
                        name="donationImage"
                        value={config.donationImage || ''}
                        onChange={handleConfigChange}
                        placeholder="https://..."
                      />

                      <Input
                        label="Meta de Donaciones (ARS) - Opcional"
                        name="donationGoal"
                        type="number"
                        value={config.donationGoal || ''}
                        onChange={handleConfigChange}
                        placeholder="Ej: 100000"
                      />
                  </div>
                </MangaCard>

                <MangaCard className="border-t-4 border-t-purple-600">
                  <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                    <Trophy size={20} /> Concurso de Cosplay
                  </h3>
                  <p className="text-xs text-gray-500 mb-4">
                    Configurá el límite de cupos para el concurso de cosplay. Cuando se alcance el límite,
                    los usuarios solo podrán anotarse en la lista de espera.
                  </p>
                  <Input
                    label="Límite de Cupos"
                    name="cosplayLimit"
                    type="number"
                    value={config.cosplayLimit || 20}
                    onChange={handleConfigChange}
                    placeholder="20"
                    min="1"
                  />
                  <p className="text-xs text-gray-600 mt-2">
                    Cupos actuales: {stats?.cosplay?.approved || 0} aprobados + {stats?.cosplay?.pending || 0} pendientes = {(stats?.cosplay?.approved || 0) + (stats?.cosplay?.pending || 0)} ocupados
                  </p>
                </MangaCard>

                <MangaCard className="border-t-4 border-t-yellow-500">
                  <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                    <Star size={20} /> Cosplay Invitados
                  </h3>
                  <p className="text-xs text-gray-500 mb-4">
                    Configurá el límite de cupos para cosplay invitados especiales.
                  </p>
                  <Input
                    label="Límite de Cupos"
                    name="cosplayGuestLimit"
                    type="number"
                    value={config.cosplayGuestLimit || 30}
                    onChange={handleConfigChange}
                    placeholder="30"
                    min="1"
                  />
                  <p className="text-xs text-gray-600 mt-2">
                    Cupos actuales: {cosplayGuests.filter(g => g.status.toUpperCase() === 'CONFIRMADO').length} confirmados + {cosplayGuests.filter(g => g.status.toUpperCase() === 'INSCRIPTO').length} inscriptos = {cosplayGuests.filter(g => g.status.toUpperCase() !== 'RECHAZADO').length} ocupados
                  </p>
                </MangaCard>

                <MangaCard className="border-t-4 border-t-pink-500">
                  <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                    <Mic size={20} /> Karaoke
                  </h3>
                  <p className="text-xs text-gray-500 mb-4">
                    Configurá el límite de cupos para el karaoke por evento.
                  </p>
                  <Input
                    label="Límite de Cupos"
                    name="karaokeLimit"
                    type="number"
                    value={config.karaokeLimit || 12}
                    onChange={handleConfigChange}
                    placeholder="12"
                    min="1"
                  />
                  <p className="text-xs text-gray-600 mt-2">
                    Cupos actuales: {karaokeList.filter(k => k.status === 'Aprobado' || k.status === 'APROBADO').length} aprobados + {karaokeList.filter(k => k.status === 'Pendiente' || k.status === 'PENDIENTE').length} pendientes = {karaokeList.filter(k => k.status !== 'Rechazado' && k.status !== 'RECHAZADO').length} ocupados
                  </p>
                </MangaCard>

                {configNotice && (
                  <div className={`p-4 border-2 shadow-manga animate-in slide-in-from-top-2 flex items-start gap-3 ${configNotice.type === 'success' ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500'}`}>
                    {configNotice.type === 'success' ? (
                      <Check className="text-green-600 shrink-0" size={24} />
                    ) : (
                      <AlertTriangle className="text-red-600 shrink-0" size={24} />
                    )}
                    <div>
                      <p className={`font-bold ${configNotice.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>
                        {configNotice.type === 'success' ? '✓ Cambios guardados exitosamente' : '✗ Error al guardar'}
                      </p>
                      <p className={`text-sm mt-1 ${configNotice.type === 'success' ? 'text-green-700' : 'text-red-700'}`}>
                        {configNotice.text}
                      </p>
                    </div>
                  </div>
                )}

                <Button onClick={handleSaveConfig} className="w-full flex items-center justify-center gap-2 py-4 text-lg">
                    <Save size={18} /> Guardar Cambios Globales
                </Button>
            </div>
         </div>
      )}

      {/* --- MODALS --- */}
      
      {/* STAND DETAIL MODAL */}
      {viewStand && (
          <Modal title={`Detalle: ${viewStand.brandName}`} onClose={() => setViewStand(null)}>
              <div className="space-y-6">
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                        <h4 className="text-xs font-bold uppercase text-gray-500">Contacto</h4>
                        <p>{viewStand.contactName}</p>
                        <p className="text-sm text-gray-600">{viewStand.email}</p>
                        <p className="text-sm font-mono">{viewStand.phone}</p>
                    </div>
                    <div>
                        <h4 className="text-xs font-bold uppercase text-gray-500">Info Stand</h4>
                        <p><span className="font-bold">Tipo:</span> {viewStand.type}</p>
                        <p className="text-sm text-blue-600">{viewStand.socials}</p>
                        <Badge color={viewStand.status === 'PENDIENTE' ? 'blue' : viewStand.status === 'APROBADA' ? 'red' : 'purple'}>
                            {viewStand.status}
                        </Badge>
                    </div>
                 </div>

                 <div className="bg-gray-50 p-3 rounded border border-black">
                     <h4 className="text-xs font-bold uppercase text-gray-500 mb-1">Descripción</h4>
                     <p className="text-sm">{viewStand.description}</p>
                 </div>
                 
                 {viewStand.needs && (
                    <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
                        <h4 className="text-xs font-bold uppercase text-yellow-700 mb-1">Necesidades Especiales</h4>
                        <p className="text-sm">{viewStand.needs}</p>
                    </div>
                 )}

                 <div>
                    <h4 className="font-display text-lg mb-2">Fotos de Mercadería</h4>
                    {viewStand.images && viewStand.images.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {viewStand.images.map((img, idx) => (
                                <div key={idx} className="aspect-square border border-black overflow-hidden group relative">
                                    <img src={img} alt="Stand merch" className="w-full h-full object-cover" />
                                    <a href={img} target="_blank" rel="noreferrer" className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100 text-white">
                                        <ZoomIn size={24} />
                                    </a>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500 italic text-sm">No subió fotos.</p>
                    )}
                 </div>

                 {/* CHAT BUTTON */}
                 <div className="pt-4 border-t border-gray-200">
                    <Button
                        onClick={() => {
                            setChatStand(viewStand);
                            setViewStand(null);
                        }}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white border-blue-800 flex items-center justify-center gap-2"
                    >
                        <MessageCircle size={20} /> Enviar Mensaje al Vendedor
                    </Button>
                 </div>

                 {/* REJECTION LOGIC FOR STANDS */}
                 {viewStand.status !== 'APROBADA' && (
                     <div className="pt-4 border-t border-gray-200">
                        {isRejectingStand ? (
                            <div className="animate-in fade-in slide-in-from-bottom-2 bg-red-50 p-4 border border-red-200 rounded">
                                <label className="flex text-sm font-bold mb-2 uppercase text-red-600 items-center gap-2">
                                    <AlertTriangle size={16} /> Motivo del Rechazo (Se enviará al chat)
                                </label>
                                <textarea
                                    className="w-full border-2 border-red-300 p-2 mb-3 bg-white focus:outline-none focus:border-red-600"
                                    rows={3}
                                    placeholder="Ej: No se permite la venta de bebidas alcohólicas en este evento."
                                    value={standRejectionReason}
                                    onChange={(e) => setStandRejectionReason(e.target.value)}
                                />
                                <div className="flex gap-2">
                                    <Button onClick={handleExecuteStandRejection} className="flex-1 bg-red-600 hover:bg-red-700 text-white border-red-800 text-sm">
                                        Enviar y Rechazar
                                    </Button>
                                    <Button onClick={() => setIsRejectingStand(false)} variant="outline" className="flex-1 text-sm border-gray-400 text-gray-600">
                                        Cancelar
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex gap-4">
                                {viewStand.status === 'PENDIENTE' && (
                                    <Button onClick={() => handleStandStatus(viewStand.id, 'Aprobada')} className="flex-1 bg-green-600 hover:bg-green-700 text-white border-green-800">
                                        Aprobar Stand
                                    </Button>
                                )}
                                {viewStand.status !== 'RECHAZADA' && (
                                    <Button onClick={() => setIsRejectingStand(true)} variant="outline" className="flex-1 text-red-600 border-red-600 hover:bg-red-50">
                                        Rechazar
                                    </Button>
                                )}
                            </div>
                        )}
                     </div>
                 )}

                 {/* Botón eliminar para Stand cuando está Aprobada o Rechazada */}
                 {(viewStand.status === 'APROBADA' || viewStand.status === 'RECHAZADA') && (
                     <div className="pt-4 border-t border-gray-200">
                        <button
                            onClick={() => {
                                setDeletingStand(viewStand);
                                setShowDeleteStandConfirm(true);
                            }}
                            className="w-full bg-red-100 text-red-700 px-4 py-2 rounded hover:bg-red-200 border border-red-300 flex items-center justify-center gap-2 text-sm font-bold"
                        >
                            <Trash2 size={16} /> Eliminar Stand Permanentemente
                        </button>
                     </div>
                 )}
              </div>
          </Modal>
      )}

      {/* COSPLAY DETAIL MODAL */}
      {viewCosplay && (
          <Modal title={`Detalle: ${viewCosplay.participantName}`} onClose={() => setViewCosplay(null)}>
              <div className="space-y-6">
                 {/* Header Status */}
                 <div className="flex justify-between items-center bg-gray-50 p-3 border border-black rounded">
                     <div className="flex items-center gap-4">
                        {/* Show assigned number if cosplay guest */}
                        {(viewCosplay as any).assignedNumber && (
                          <div className="flex flex-col items-center">
                            <span className="text-xs font-bold text-gray-500 uppercase mb-1">Número</span>
                            <div className="flex items-center justify-center w-14 h-14 bg-yellow-400 border-3 border-black font-bold text-2xl shadow-manga">
                              {(viewCosplay as any).assignedNumber}
                            </div>
                          </div>
                        )}
                        <div>
                          <span className="text-xs font-bold text-gray-500 uppercase">Estado</span>
                          <div className="mt-1">
                              <Badge color={viewCosplay.status === 'Inscripto' ? 'yellow' : viewCosplay.status === 'Confirmado' ? 'green' : 'red'}>
                                  {viewCosplay.status}
                              </Badge>
                          </div>
                        </div>
                     </div>
                     <button
                        onClick={() => { setViewCosplay(null); setChatCosplay(viewCosplay); }}
                        className="bg-blue-600 text-white px-4 py-2 rounded font-bold hover:bg-blue-700 flex items-center gap-2"
                     >
                        <MessageCircle size={18} /> Iniciar Chat
                     </button>
                 </div>

                 {/* Reference Image */}
                 <div className="flex justify-center">
                    <div className="w-full max-w-sm border-4 border-black shadow-manga bg-white p-2 rotate-1">
                        {viewCosplay.referenceImage ? (
                            <img src={viewCosplay.referenceImage} alt="Ref" className="w-full h-auto object-cover" />
                        ) : (
                            <div className="h-64 bg-gray-200 flex items-center justify-center text-gray-400">Sin Imagen</div>
                        )}
                        <p className="text-center font-display text-lg mt-2 uppercase">{viewCosplay.characterName}</p>
                        <p className="text-center text-xs text-gray-500">{viewCosplay.seriesName}</p>
                    </div>
                 </div>

                 {/* Event */}
                 {viewCosplay.event && (
                   <div className="bg-blue-50 p-3 rounded border border-blue-200">
                     <h4 className="text-xs font-bold uppercase text-blue-800 mb-1 flex items-center gap-1">
                       <Calendar size={12}/> Evento
                     </h4>
                     <p className="font-bold text-lg">{viewCosplay.event.title}</p>
                     <p className="text-sm text-gray-600">
                       📅 {new Date(viewCosplay.event.date).toLocaleDateString('es-AR')}
                     </p>
                   </div>
                 )}

                 <div className="grid grid-cols-2 gap-4">
                    <div>
                        <h4 className="text-xs font-bold uppercase text-gray-500">Participante</h4>
                        <p>{viewCosplay.participantName}</p>
                        <p className="text-sm italic text-gray-600">"{viewCosplay.nickname}"</p>
                    </div>
                    <div>
                        <h4 className="text-xs font-bold uppercase text-gray-500">Categoría</h4>
                        <Badge color="blue">{viewCosplay.category}</Badge>
                    </div>
                 </div>

                 <div className="bg-green-50 p-3 rounded border border-green-200">
                    <h4 className="text-xs font-bold uppercase text-green-800 mb-1 flex items-center gap-1"><MessageCircle size={12}/> WhatsApp</h4>
                    <p className="font-mono text-lg">{viewCosplay.whatsapp}</p>
                 </div>

                 {/* Instagram y Website */}
                 {(viewCosplay.instagram || viewCosplay.website) && (
                   <div className="grid grid-cols-2 gap-4">
                     {viewCosplay.instagram && (
                       <div className="bg-pink-50 p-3 rounded border border-pink-200">
                         <h4 className="text-xs font-bold uppercase text-pink-800 mb-1 flex items-center gap-1"><Instagram size={12}/> Instagram</h4>
                         <a href={`https://instagram.com/${viewCosplay.instagram.replace('@', '')}`} target="_blank" rel="noreferrer" className="text-pink-600 hover:underline text-sm">
                           {viewCosplay.instagram}
                         </a>
                       </div>
                     )}
                     {viewCosplay.website && (
                       <div className="bg-blue-50 p-3 rounded border border-blue-200">
                         <h4 className="text-xs font-bold uppercase text-blue-800 mb-1 flex items-center gap-1"><Globe size={12}/> Website</h4>
                         <a href={viewCosplay.website} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline text-sm break-all">
                           {viewCosplay.website}
                         </a>
                       </div>
                     )}
                   </div>
                 )}

                 {viewCosplay.audioLink ? (
                     <div className="bg-purple-50 p-3 rounded border border-purple-200">
                        <h4 className="text-xs font-bold uppercase text-purple-800 mb-1 flex items-center gap-1"><Mic2 size={12}/> Audio / Performance</h4>
                        <a href={viewCosplay.audioLink} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline break-all text-sm mb-2 block">
                            {viewCosplay.audioLink}
                        </a>
                        {(viewCosplay.audioStartTime || viewCosplay.audioEndTime) && (
                            <div className="mt-2 pt-2 border-t border-purple-200 flex items-center gap-3">
                                <Clock size={14} className="text-purple-600" />
                                <div className="text-sm font-bold text-purple-900">
                                    {viewCosplay.audioStartTime && (
                                        <span>Inicio: <span className="font-mono bg-purple-100 px-2 py-0.5 rounded">{viewCosplay.audioStartTime}</span></span>
                                    )}
                                    {viewCosplay.audioStartTime && viewCosplay.audioEndTime && <span className="mx-2">→</span>}
                                    {viewCosplay.audioEndTime && (
                                        <span>Fin: <span className="font-mono bg-purple-100 px-2 py-0.5 rounded">{viewCosplay.audioEndTime}</span></span>
                                    )}
                                </div>
                            </div>
                        )}
                     </div>
                 ) : (
                     <p className="text-xs text-gray-500 italic">No adjuntó link de audio (Solo desfile).</p>
                 )}

                 {/* Actions */}
                 <div className="pt-4 border-t border-gray-200">
                     {isRejectingCosplay ? (
                        <div className="animate-in fade-in slide-in-from-bottom-2 bg-red-50 p-4 border border-red-200 rounded">
                            <label className="flex text-sm font-bold mb-2 uppercase text-red-600 items-center gap-2">
                                <AlertTriangle size={16} /> Motivo del Rechazo (Se enviará al chat)
                            </label>
                            <textarea 
                                className="w-full border-2 border-red-300 p-2 mb-3 bg-white focus:outline-none focus:border-red-600" 
                                rows={3}
                                placeholder="Ej: La imagen de referencia no es clara. Por favor subí una mejor."
                                value={cosplayRejectionReason}
                                onChange={(e) => setCosplayRejectionReason(e.target.value)}
                            />
                            <div className="flex gap-2">
                                <Button onClick={handleExecuteCosplayRejection} className="flex-1 bg-red-600 hover:bg-red-700 text-white border-red-800 text-sm">
                                    Enviar y Rechazar
                                </Button>
                                <Button onClick={() => setIsRejectingCosplay(false)} variant="outline" className="flex-1 text-sm border-gray-400 text-gray-600">
                                    Cancelar
                                </Button>
                            </div>
                        </div>
                     ) : (
                        <div className="space-y-3">
                            <div className="flex gap-4">
                                {viewCosplay.status !== 'Confirmado' && (
                                    <Button onClick={() => handleCosplayStatus(viewCosplay.id, 'Confirmado')} className="flex-1 bg-green-600 hover:bg-green-700 text-white border-green-800">
                                        Confirmar
                                    </Button>
                                )}
                                {viewCosplay.status !== 'Rechazado' && (
                                    <Button onClick={() => setIsRejectingCosplay(true)} variant="outline" className="flex-1 text-red-600 border-red-600 hover:bg-red-50">
                                        Rechazar
                                    </Button>
                                )}
                            </div>

                            {/* Botón eliminar para Cosplay Guest cuando está Confirmado o Rechazado (case-insensitive) */}
                            {(viewCosplay as any).assignedNumber !== undefined &&
                             (viewCosplay.status.toUpperCase() === 'CONFIRMADO' || viewCosplay.status.toUpperCase() === 'RECHAZADO') && (
                                <button
                                    onClick={() => {
                                        setDeletingCosplayGuest(viewCosplay as unknown as CosplayGuest);
                                        setShowDeleteCosplayGuestConfirm(true);
                                    }}
                                    className="w-full bg-red-100 text-red-700 px-4 py-2 rounded hover:bg-red-200 border border-red-300 flex items-center justify-center gap-2 text-sm font-bold"
                                >
                                    <Trash2 size={16} /> Eliminar Registro Permanentemente
                                </button>
                            )}

                            {/* Botón eliminar para Cosplay Registration (concurso, no guest) cuando está Confirmado o Rechazado (case-insensitive) */}
                            {(viewCosplay as any).assignedNumber === undefined &&
                             (viewCosplay.status.toUpperCase() === 'CONFIRMADO' || viewCosplay.status.toUpperCase() === 'RECHAZADO') && (
                                <button
                                    onClick={() => {
                                        setDeletingCosplay(viewCosplay as CosplayRegistration);
                                        setShowDeleteCosplayConfirm(true);
                                    }}
                                    className="w-full bg-red-100 text-red-700 px-4 py-2 rounded hover:bg-red-200 border border-red-300 flex items-center justify-center gap-2 text-sm font-bold"
                                >
                                    <Trash2 size={16} /> Eliminar Registro Permanentemente
                                </button>
                            )}
                        </div>
                     )}
                 </div>
              </div>
          </Modal>
      )}

      {/* SHARED CHAT MODAL (Works for Stand or Cosplay) */}
      {(chatStand || chatCosplay) && (
          <Modal title={`Chat con ${chatStand ? chatStand.brandName : chatCosplay?.participantName}`} onClose={() => {
            chatClosedByUserRef.current = true;
            setChatStand(null);
            setChatCosplay(null);
            setChatImage(null);
          }}>
              <div className="flex flex-col h-[50vh]">
                  <div className="bg-gray-50 p-3 mb-4 text-xs border border-gray-200 rounded flex items-center justify-between">
                      <div>
                          <span className="font-bold">Contacto:</span> {chatStand ? chatStand.contactName : chatCosplay?.participantName}
                      </div>
                      <a
                          href={`https://wa.me/${(chatStand ? chatStand.phone : chatCosplay?.whatsapp)?.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-full font-bold transition-colors text-xs"
                          title="Abrir WhatsApp"
                      >
                          <Phone size={14} />
                          {chatStand ? chatStand.phone : chatCosplay?.whatsapp}
                      </a>
                  </div>
                  <div className="grow overflow-y-auto space-y-4 p-2 mb-4" ref={chatScrollRef}>
                      {((chatStand?.messages || []).length === 0 && (chatCosplay?.messages || []).length === 0) && <div className="text-center text-gray-400 italic text-sm mt-10">No hay mensajes. Iniciá la conversación.</div>}
                      {(chatStand ? (chatStand.messages || []) : (chatCosplay?.messages || [])).map(msg => (
                          <div key={msg.id} className={`flex flex-col ${msg.sender === 'ADMIN' ? 'items-end' : 'items-start'}`}>
                              <div className={`max-w-[80%] p-3 border-2 border-black shadow-sm ${msg.sender === 'ADMIN' ? 'bg-torami-red text-white rounded-tl-xl rounded-bl-xl rounded-br-xl' : 'bg-white text-black rounded-tr-xl rounded-br-xl rounded-bl-xl'}`}>
                                  <p className="text-sm font-bold mb-1">{msg.sender === 'ADMIN' ? 'Tú (Admin)' : (chatStand ? chatStand.contactName : chatCosplay?.participantName)}</p>
                                  {msg.imageUrl && (
                                    <div className="mb-2 cursor-pointer group relative" onClick={() => setViewImage(msg.imageUrl)}>
                                        <img src={msg.imageUrl} alt="attachment" className="rounded border border-black max-h-40 object-cover bg-white transition-opacity group-hover:opacity-80" />
                                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded flex items-center justify-center">
                                            <span className="text-white text-xs opacity-0 group-hover:opacity-100 bg-black bg-opacity-70 px-2 py-1 rounded">
                                                Click para ampliar
                                            </span>
                                        </div>
                                    </div>
                                  )}
                                  <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                              </div>
                              <span className="text-xs text-gray-500 mt-1">{msg.timestamp}</span>
                          </div>
                      ))}
                  </div>
                  
                  {chatImage && (
                    <div className="flex items-center gap-2 mb-2 p-2 bg-gray-100 border border-gray-300 rounded animate-in fade-in">
                        <img src={chatImage} alt="Preview" className="h-12 w-12 object-cover border border-black rounded" />
                        <span className="text-xs text-gray-500 italic grow">Imagen adjunta</span>
                        <button onClick={() => setChatImage(null)} className="text-red-500 p-1"><X size={16}/></button>
                    </div>
                  )}

                  <form onSubmit={handleSendChatMessage} className="flex gap-2 border-t pt-4 items-end">
                      <button 
                        type="button" 
                        onClick={() => chatFileRef.current?.click()}
                        className="p-2 text-gray-500 hover:text-torami-red border-2 border-transparent hover:border-torami-red transition-all"
                      >
                          <Paperclip size={20} />
                      </button>
                      <input type="file" ref={chatFileRef} className="hidden" accept="image/*" onChange={handleChatFileSelect} />
                      
                      <input 
                        type="text" 
                        className="grow border-2 border-black p-2 focus:outline-none h-10" 
                        placeholder="Escribir mensaje..." 
                        value={chatMessage} 
                        onChange={(e) => setChatMessage(e.target.value)} 
                      />
                      <Button type="submit" className="p-2 bg-black text-white hover:bg-gray-800 h-10 w-10 flex items-center justify-center"><Send size={18} /></Button>
                  </form>
              </div>
          </Modal>
      )}

      {/* GALLERY PHOTO MODERATION MODAL */}
      {selectedPhoto && (
          <PhotoModal title="Moderación de Foto" onClose={() => setSelectedPhoto(null)}>
              <div className="w-full md:w-2/3 bg-black flex items-center justify-center p-2 sm:p-4 min-h-52 sm:min-h-96">
                  <img src={selectedPhoto.url} alt="Moderation content" className="max-w-full max-h-[40vh] sm:max-h-[80vh] object-contain" />
              </div>
              <div className="w-full md:w-1/3 p-4 sm:p-6 bg-white flex flex-col border-t-2 md:border-t-0 md:border-l-2 border-black">
                  {/* Photo Metadata */}
                  <div className="mb-4 bg-gray-50 p-3 border-2 border-gray-200 space-y-2">
                    {selectedPhoto.user && (
                      <div className="flex items-center gap-2 text-sm">
                        <Users size={14} className="text-gray-500" />
                        <span className="font-bold">{selectedPhoto.user.name}</span>
                      </div>
                    )}
                    {selectedPhoto.event && (
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar size={14} className="text-gray-500" />
                        <span className="font-bold">{selectedPhoto.event.title}</span>
                      </div>
                    )}
                    {selectedPhoto.createdAt && (
                      <div className="text-xs text-gray-500">
                        Subida: {new Date(selectedPhoto.createdAt).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    )}
                    {selectedPhoto.approvedByName && selectedPhoto.approvedAt && (
                      <div className="text-xs text-gray-600 pt-2 border-t border-gray-300">
                        <span className="font-semibold">{selectedPhoto.status === 'APPROVED' ? 'Aprobada' : 'Moderada'} por:</span> {selectedPhoto.approvedByName}
                        <div className="text-gray-500 mt-1">
                          {new Date(selectedPhoto.approvedAt).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mb-6 flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-sm text-gray-500 uppercase mb-2">Estado Actual</h4>
                      <Badge color={selectedPhoto.status === 'APPROVED' ? 'green' : selectedPhoto.status === 'REJECTED' ? 'red' : 'yellow'}>
                        {selectedPhoto.status === 'APPROVED' ? 'Aprobada' : selectedPhoto.status === 'REJECTED' ? 'Rechazada' : 'Pendiente'}
                      </Badge>
                    </div>
                  </div>

                  {selectedPhoto.feedback && (
                    <div className="mb-4 bg-red-50 p-3 border border-red-200 rounded">
                        <p className="text-xs font-bold text-red-700 uppercase flex items-center gap-1"><AlertTriangle size={12}/> Motivo de rechazo anterior:</p>
                        <p className="text-sm text-red-900 mt-1">{selectedPhoto.feedback}</p>
                    </div>
                  )}
                  
                  <form onSubmit={handleGallerySave} className="grow flex flex-col">
                      <div className="mb-4 grow">
                          <label className="block text-sm font-bold mb-1 uppercase">Descripción del Usuario</label>
                          <textarea 
                              className="w-full min-h-24 border-2 border-black p-3 focus:outline-none focus:shadow-manga resize-none bg-gray-50"
                              value={selectedPhoto.description || ''}
                              onChange={(e) => setSelectedPhoto({...selectedPhoto, description: e.target.value})}
                          ></textarea>
                          <div className="text-right mt-1">
                              <button type="submit" className="text-xs font-bold text-blue-600 flex items-center justify-end gap-1 hover:underline">
                                  <Save size={12} /> Guardar Texto
                              </button>
                          </div>
                      </div>
                  </form>

                  <div className="mt-auto pt-6 border-t border-gray-200">
                      {isRejecting ? (
                          <div className="animate-in fade-in slide-in-from-bottom-4">
                              <label className="block text-sm font-bold mb-1 uppercase text-red-600">Motivo del Rechazo</label>
                              <textarea 
                                className="w-full border-2 border-red-300 p-2 mb-3 bg-red-50 focus:outline-none focus:border-red-600" 
                                rows={3}
                                placeholder="Explica qué debe modificar el usuario..."
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                              />
                              <div className="flex gap-2">
                                  <Button onClick={handleGalleryReject} className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm">
                                      Confirmar Rechazo
                                  </Button>
                                  <Button onClick={() => setIsRejecting(false)} variant="outline" className="flex-1 text-sm border-gray-400 text-gray-600">
                                      Cancelar
                                  </Button>
                              </div>
                          </div>
                      ) : (
                          <div className="space-y-3">
                              {selectedPhoto.status !== 'APPROVED' && (
                                  <Button onClick={handleGalleryApprove} className="w-full bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-2">
                                      <Check size={20} /> Aprobar y Publicar
                                  </Button>
                              )}
                              
                              <Button onClick={() => setIsRejecting(true)} className="w-full bg-yellow-400 text-black border-yellow-600 hover:bg-yellow-500 flex items-center justify-center gap-2">
                                  <RefreshCw size={20} /> Rechazar (Solicitar Cambios)
                              </Button>

                              <Button onClick={() => setShowDeleteConfirm(true)} variant="outline" className="w-full border-red-600 text-red-600 hover:bg-red-50 flex items-center justify-center gap-2 text-xs py-2">
                                  <Trash2 size={16} /> Eliminar Definitivamente (Spam)
                              </Button>
                          </div>
                      )}
                  </div>
              </div>
          </PhotoModal>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && selectedPhoto && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4 backdrop-blur-md">
          <div className="bg-white border-4 border-red-600 shadow-manga w-full max-w-md animate-in zoom-in-95 duration-200">
            <div className="bg-red-600 text-white p-4 flex items-center gap-3">
              <AlertTriangle size={24} />
              <h3 className="font-display text-xl">¡Advertencia!</h3>
            </div>
            <div className="p-6">
              <p className="text-lg font-bold mb-3">¿Eliminar esta foto permanentemente?</p>
              <p className="text-gray-700 mb-2">Esta acción <span className="font-bold text-red-600">no se puede deshacer</span>.</p>
              <p className="text-sm text-gray-600 mb-4">Solo eliminá fotos que sean spam o contenido inapropiado.</p>

              <div className="bg-gray-50 p-3 border-2 border-gray-200 rounded mb-4">
                <p className="text-xs text-gray-500 mb-1">📸 Foto de:</p>
                <p className="font-bold">{selectedPhoto.user?.name || 'Usuario desconocido'}</p>
                {selectedPhoto.event && (
                  <p className="text-sm text-gray-600 mt-1">Evento: {selectedPhoto.event.title}</p>
                )}
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleGalleryDelete}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white flex items-center justify-center gap-2"
                >
                  <Trash2 size={18} /> Sí, Eliminar
                </Button>
                <Button
                  onClick={() => setShowDeleteConfirm(false)}
                  variant="outline"
                  className="flex-1 border-gray-400 text-gray-700 hover:bg-gray-100"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Cosplay Guest Confirmation Modal */}
      {showDeleteCosplayGuestConfirm && deletingCosplayGuest && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4 backdrop-blur-md">
          <div className="bg-white border-4 border-red-600 shadow-manga w-full max-w-md animate-in zoom-in-95 duration-200">
            <div className="bg-red-600 text-white p-4 flex items-center gap-3">
              <AlertTriangle size={24} />
              <h3 className="font-display text-xl">¡Advertencia!</h3>
            </div>
            <div className="p-6">
              <p className="text-lg font-bold mb-3">¿Eliminar este cosplay invitado permanentemente?</p>
              <p className="text-gray-700 mb-2">Esta acción <span className="font-bold text-red-600">no se puede deshacer</span>.</p>
              <p className="text-sm text-gray-600 mb-4">Se eliminará el registro y todos sus mensajes de chat.</p>

              <div className="bg-gray-50 p-3 border-2 border-gray-200 rounded mb-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex items-center justify-center w-10 h-10 bg-yellow-400 border-2 border-black font-bold text-lg">
                    {deletingCosplayGuest.assignedNumber}
                  </div>
                  <div>
                    <p className="font-bold">{deletingCosplayGuest.participantName}</p>
                    <p className="text-sm text-gray-500 italic">"{deletingCosplayGuest.nickname}"</p>
                  </div>
                </div>
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">{deletingCosplayGuest.characterName}</span> - {deletingCosplayGuest.seriesName}
                </p>
                <Badge color={deletingCosplayGuest.status === 'Confirmado' ? 'green' : 'red'} className="mt-2">
                  {deletingCosplayGuest.status}
                </Badge>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleDeleteCosplayGuest}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white flex items-center justify-center gap-2"
                >
                  <Trash2 size={18} /> Sí, Eliminar
                </Button>
                <Button
                  onClick={() => {
                    setShowDeleteCosplayGuestConfirm(false);
                    setDeletingCosplayGuest(null);
                  }}
                  variant="outline"
                  className="flex-1 border-gray-400 text-gray-700 hover:bg-gray-100"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Karaoke Confirmation Modal */}
      {showDeleteKaraokeConfirm && deletingKaraoke && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4 backdrop-blur-md">
          <div className="bg-white border-4 border-red-600 shadow-manga w-full max-w-md animate-in zoom-in-95 duration-200">
            <div className="bg-red-600 text-white p-4 flex items-center gap-3">
              <AlertTriangle size={24} />
              <h3 className="font-display text-xl">¡Advertencia!</h3>
            </div>
            <div className="p-6">
              <p className="text-lg font-bold mb-3">¿Eliminar esta inscripción de karaoke?</p>
              <p className="text-gray-700 mb-2">Esta acción <span className="font-bold text-red-600">no se puede deshacer</span>.</p>

              <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 border-2 border-purple-200 rounded mb-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center justify-center w-12 h-12 bg-purple-600 text-white rounded-full font-bold text-lg">
                    <Mic size={24} />
                  </div>
                  <div>
                    <p className="font-bold text-lg">{deletingKaraoke.fullName}</p>
                    <p className="text-sm text-gray-600 flex items-center gap-1">
                      <div className="text-xs text-gray-600">
                        <p className="flex items-center gap-1">
                          <Music size={14} /> Opciones:
                        </p>
                        <ul className="ml-5 list-disc">
                          {[deletingKaraoke.songName, deletingKaraoke.songName2, deletingKaraoke.songName3]
                            .filter(Boolean)
                            .map((song, idx) => (
                              <li key={`${deletingKaraoke.id}-song-${idx}`}>{song}</li>
                            ))}
                        </ul>
                      </div>
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 text-sm">
                  {deletingKaraoke.assignedNumber && (
                    <span className="bg-green-100 text-green-700 px-2 py-1 rounded font-bold">
                      #{deletingKaraoke.assignedNumber}
                    </span>
                  )}
                  <Badge color={
                    deletingKaraoke.status === 'Aprobado' || deletingKaraoke.status === 'APROBADO' ? 'green' :
                    deletingKaraoke.status === 'Rechazado' || deletingKaraoke.status === 'RECHAZADO' ? 'red' : 'yellow'
                  }>
                    {deletingKaraoke.status}
                  </Badge>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {deletingKaraoke.event?.title || 'Sin evento asignado'}
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={async () => {
                    await deleteKaraoke(deletingKaraoke.id);
                    setShowDeleteKaraokeConfirm(false);
                    setDeletingKaraoke(null);
                    loadTabData('karaoke');
                  }}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white flex items-center justify-center gap-2"
                >
                  <Trash2 size={18} /> Sí, Eliminar
                </Button>
                <Button
                  onClick={() => {
                    setShowDeleteKaraokeConfirm(false);
                    setDeletingKaraoke(null);
                  }}
                  variant="outline"
                  className="flex-1 border-gray-400 text-gray-700 hover:bg-gray-100"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Stand Confirmation Modal */}
      {showDeleteStandConfirm && deletingStand && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4 backdrop-blur-md">
          <div className="bg-white border-4 border-red-600 shadow-manga w-full max-w-md animate-in zoom-in-95 duration-200">
            <div className="bg-red-600 text-white p-4 flex items-center gap-3">
              <AlertTriangle size={24} />
              <h3 className="font-display text-xl">¡Advertencia!</h3>
            </div>
            <div className="p-6">
              <p className="text-lg font-bold mb-3">¿Eliminar este stand permanentemente?</p>
              <p className="text-gray-700 mb-2">Esta acción <span className="font-bold text-red-600">no se puede deshacer</span>.</p>
              <p className="text-sm text-gray-600 mb-4">Se eliminará la solicitud y todos sus mensajes de chat.</p>

              <div className="bg-gray-50 p-3 border-2 border-gray-200 rounded mb-4">
                <p className="font-bold text-lg">{deletingStand.brandName}</p>
                <p className="text-sm text-gray-600">{deletingStand.type}</p>
                <p className="text-sm mt-2">
                  <span className="font-medium">{deletingStand.contactName}</span>
                </p>
                <Badge color={deletingStand.status === 'APROBADA' ? 'green' : 'red'} className="mt-2">
                  {deletingStand.status}
                </Badge>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleDeleteStand}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white flex items-center justify-center gap-2"
                >
                  <Trash2 size={18} /> Sí, Eliminar
                </Button>
                <Button
                  onClick={() => {
                    setShowDeleteStandConfirm(false);
                    setDeletingStand(null);
                  }}
                  variant="outline"
                  className="flex-1 border-gray-400 text-gray-700 hover:bg-gray-100"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Cosplay Registration Confirmation Modal */}
      {showDeleteCosplayConfirm && deletingCosplay && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4 backdrop-blur-md">
          <div className="bg-white border-4 border-red-600 shadow-manga w-full max-w-md animate-in zoom-in-95 duration-200">
            <div className="bg-red-600 text-white p-4 flex items-center gap-3">
              <AlertTriangle size={24} />
              <h3 className="font-display text-xl">¡Advertencia!</h3>
            </div>
            <div className="p-6">
              <p className="text-lg font-bold mb-3">¿Eliminar este registro de cosplay permanentemente?</p>
              <p className="text-gray-700 mb-2">Esta acción <span className="font-bold text-red-600">no se puede deshacer</span>.</p>
              <p className="text-sm text-gray-600 mb-4">Se eliminará la inscripción y todos sus mensajes de chat.</p>

              <div className="bg-gray-50 p-3 border-2 border-gray-200 rounded mb-4">
                <p className="font-bold">{deletingCosplay.participantName}</p>
                {deletingCosplay.nickname && (
                  <p className="text-sm text-gray-500 italic">"{deletingCosplay.nickname}"</p>
                )}
                <p className="text-sm text-gray-700 mt-2">
                  <span className="font-semibold">{deletingCosplay.characterName}</span> - {deletingCosplay.seriesName}
                </p>
                <Badge color={deletingCosplay.status === 'Confirmado' ? 'green' : 'red'} className="mt-2">
                  {deletingCosplay.status}
                </Badge>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleDeleteCosplayRegistration}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white flex items-center justify-center gap-2"
                >
                  <Trash2 size={18} /> Sí, Eliminar
                </Button>
                <Button
                  onClick={() => {
                    setShowDeleteCosplayConfirm(false);
                    setDeletingCosplay(null);
                  }}
                  variant="outline"
                  className="flex-1 border-gray-400 text-gray-700 hover:bg-gray-100"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE USER CONFIRMATION MODAL */}
      {showDeleteUserConfirm && deletingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4 backdrop-blur-md">
          <div className="bg-white border-4 border-red-600 shadow-manga w-full max-w-md animate-in zoom-in-95 duration-200">
            <div className="bg-red-600 text-white p-4 flex items-center gap-3">
              <AlertTriangle size={24} />
              <h3 className="font-display text-xl">¡Advertencia!</h3>
            </div>
            <div className="p-6">
              <p className="text-lg font-bold mb-3">¿Eliminar este usuario permanentemente?</p>
              <p className="text-gray-700 mb-2">Esta acción <span className="font-bold text-red-600">no se puede deshacer</span>.</p>
              <p className="text-sm text-gray-600 mb-4">Se eliminará el usuario y todos sus datos asociados (inscripciones, stands, galería, etc).</p>

              <div className="bg-gray-50 p-4 border-2 border-gray-200 rounded mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-torami-red to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                    {deletingUser.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-lg">{deletingUser.name}</p>
                    <p className="text-sm text-gray-600">{deletingUser.email}</p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge color={deletingUser.role === 'ADMIN' ? 'purple' : deletingUser.role === 'SUPER_ADMIN' ? 'red' : 'blue'}>
                    {deletingUser.role}
                  </Badge>
                  {deletingUser.entryAuthorized && (
                    <Badge color="green">Entrada Autorizada</Badge>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleDeleteUser}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white flex items-center justify-center gap-2"
                >
                  <Trash2 size={18} /> Sí, Eliminar
                </Button>
                <Button
                  onClick={() => {
                    setShowDeleteUserConfirm(false);
                    setDeletingUser(null);
                  }}
                  variant="outline"
                  className="flex-1 border-gray-400 text-gray-700 hover:bg-gray-100"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EDIT EVENT MODAL */}
      {editingEvent && (
          <Modal title={editingEvent.id ? 'Editar Evento' : 'Nuevo Evento'} onClose={() => setEditingEvent(null)}>
              <form onSubmit={handleSaveEvent} className="space-y-4">
                  <Input label="Título" value={editingEvent.title} onChange={(e:any) => setEditingEvent({...editingEvent, title: e.target.value})} required />

                  {/* Media Manager for Event Images (Upload or Link) */}
                  <MediaManager
                    media={editingEvent.images || []}
                    onChange={(imgs) => setEditingEvent({...editingEvent, images: imgs})}
                    label="Imágenes / Videos (Max 5)"
                  />

                  <div className="grid grid-cols-2 gap-4">
                      <Input label="Fecha (DD/MM/AAAA)" placeholder="25/12/2025" value={editingEvent.date} onChange={(e:any) => setEditingEvent({...editingEvent, date: e.target.value})} required />
                      <Input label="Horario" placeholder="14:00 - 20:00" value={editingEvent.time} onChange={(e:any) => setEditingEvent({...editingEvent, time: e.target.value})} required />
                  </div>
                  <Input label="Ubicación" value={editingEvent.location} onChange={(e:any) => setEditingEvent({...editingEvent, location: e.target.value})} required />
                  <Input label="Tags (sep por comas)" value={Array.isArray(editingEvent.tags) ? editingEvent.tags.join(', ') : editingEvent.tags} onChange={(e:any) => setEditingEvent({...editingEvent, tags: e.target.value})} />
                  <div>
                      <label className="block text-sm font-bold mb-1 uppercase">Descripción</label>
                      <textarea className="w-full border-2 border-black p-2 bg-white" rows={3} value={editingEvent.description} onChange={(e:any) => setEditingEvent({...editingEvent, description: e.target.value})} required />
                  </div>
                  <div className="flex gap-4 p-4 bg-gray-50 border border-black">
                      <label className="flex items-center gap-2 cursor-pointer font-bold">
                        <input type="checkbox" className="w-5 h-5 accent-torami-red" checked={editingEvent.isFeatured} onChange={(e) => setEditingEvent({...editingEvent, isFeatured: e.target.checked})} />
                        Destacado
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer font-bold">
                        <input type="checkbox" className="w-5 h-5 accent-torami-red" checked={editingEvent.rainCheck} onChange={(e) => setEditingEvent({...editingEvent, rainCheck: e.target.checked})} />
                        Se suspende por lluvia
                      </label>
                  </div>

                  {/* Precio de entrada */}
                  <div className="p-4 bg-yellow-50 border-2 border-black space-y-3">
                      <h4 className="font-bold uppercase text-sm">Entrada</h4>
                      <label className="flex items-center gap-2 cursor-pointer font-bold">
                        <input
                          type="checkbox"
                          className="w-5 h-5 accent-green-600"
                          checked={editingEvent.isFree}
                          onChange={(e) => setEditingEvent({...editingEvent, isFree: e.target.checked, ticketPrice: e.target.checked ? undefined : editingEvent.ticketPrice})}
                        />
                        Entrada Gratuita
                      </label>
                      {!editingEvent.isFree && (
                        <div className="grid grid-cols-2 gap-4">
                          <Input
                            label="Precio (ARS)"
                            type="number"
                            placeholder="5000"
                            value={editingEvent.ticketPrice || ''}
                            onChange={(e:any) => setEditingEvent({...editingEvent, ticketPrice: parseFloat(e.target.value) || undefined})}
                          />
                          <Input
                            label="Link de compra (opcional)"
                            placeholder="https://..."
                            value={editingEvent.ticketLink || ''}
                            onChange={(e:any) => setEditingEvent({...editingEvent, ticketLink: e.target.value})}
                          />
                        </div>
                      )}
                  </div>

                  <Button type="submit" className="w-full">Guardar Evento</Button>
              </form>
          </Modal>
      )}

      {/* EDIT SPONSOR MODAL */}
      {editingSponsor && (
          <Modal title={editingSponsor.id ? 'Editar Sponsor' : 'Nuevo Sponsor'} onClose={() => setEditingSponsor(null)}>
              <form onSubmit={handleSaveSponsor} className="space-y-4">
                  <Input label="Nombre" value={editingSponsor.name} onChange={(e:any) => setEditingSponsor({...editingSponsor, name: e.target.value})} required />
                  
                  {/* Single Image Upload for Sponsor */}
                  <MediaManager 
                    media={editingSponsor.logoUrl ? [editingSponsor.logoUrl] : []}
                    onChange={(imgs) => setEditingSponsor({...editingSponsor, logoUrl: imgs[0] || ''})}
                    max={1}
                    label="Logo"
                  />

                  <Input label="Link" value={editingSponsor.link} onChange={(e:any) => setEditingSponsor({...editingSponsor, link: e.target.value})} required />
                  <div>
                      <label className="block text-sm font-bold mb-1 uppercase">Categoría</label>
                      <select className="w-full border-2 border-black p-2 bg-white" value={editingSponsor.category} onChange={(e:any) => setEditingSponsor({...editingSponsor, category: e.target.value})}>
                          <option value="Principal">Principal</option>
                          <option value="Colaborador">Colaborador</option>
                          <option value="Media Partner">Media Partner</option>
                      </select>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer p-2 bg-gray-50 border border-black font-bold">
                    <input type="checkbox" className="w-5 h-5 accent-torami-red" checked={editingSponsor.active} onChange={(e) => setEditingSponsor({...editingSponsor, active: e.target.checked})} /> 
                    Activo
                  </label>
                  <Button type="submit" className="w-full">Guardar</Button>
              </form>
          </Modal>
      )}

      {/* EDIT GIVEAWAY MODAL */}
      {editingGiveaway && (
          <Modal title={editingGiveaway.id ? 'Editar Sorteo' : 'Nuevo Sorteo'} onClose={() => setEditingGiveaway(null)}>
              <form onSubmit={handleSaveGiveaway} className="space-y-4">
                  <Input label="Título" value={editingGiveaway.title} onChange={(e:any) => setEditingGiveaway({...editingGiveaway, title: e.target.value})} required />
                  
                  {/* Media Manager for Giveaway */}
                  <MediaManager 
                    media={editingGiveaway.images || []} 
                    onChange={(imgs) => setEditingGiveaway({...editingGiveaway, images: imgs})} 
                  />

                  <Input label="Premio" value={editingGiveaway.prize} onChange={(e:any) => setEditingGiveaway({...editingGiveaway, prize: e.target.value})} required />
                  <div className="grid grid-cols-2 gap-4">
                      <Input label="Inicio" type="date" value={editingGiveaway.startDate} onChange={(e:any) => setEditingGiveaway({...editingGiveaway, startDate: e.target.value})} required />
                      <Input label="Fin" type="date" value={editingGiveaway.endDate} onChange={(e:any) => setEditingGiveaway({...editingGiveaway, endDate: e.target.value})} required />
                  </div>
                  <div>
                      <label className="block text-sm font-bold mb-1 uppercase">Descripción</label>
                      <textarea className="w-full border-2 border-black p-2 bg-white" rows={3} value={editingGiveaway.description} onChange={(e:any) => setEditingGiveaway({...editingGiveaway, description: e.target.value})} required />
                  </div>
                  <div>
                      <label className="block text-sm font-bold mb-1 uppercase">Estado</label>
                      <select className="w-full border-2 border-black p-2 bg-white" value={editingGiveaway.status} onChange={(e:any) => setEditingGiveaway({...editingGiveaway, status: e.target.value})}>
                          <option value="Activo">Activo</option>
                          <option value="Finalizado">Finalizado</option>
                      </select>
                  </div>
                  <Button type="submit" className="w-full">Guardar</Button>
              </form>
          </Modal>
      )}

      {/* EDIT USER MODAL */}
      {editingUser && (
          <Modal title="Editar Usuario" onClose={() => setEditingUser(null)}>
              <form onSubmit={handleSaveUser} className="space-y-4">
                  <Input
                    label="Nombre"
                    value={editingUser.name || ''}
                    onChange={(e:any) => setEditingUser({...editingUser, name: e.target.value})}
                    required
                  />
                  <Input
                    label="Email"
                    type="email"
                    value={editingUser.email || ''}
                    onChange={(e:any) => setEditingUser({...editingUser, email: e.target.value})}
                    required
                  />
                  <Input
                    label="WhatsApp"
                    placeholder="+54 9 11 1234-5678"
                    value={editingUser.whatsapp || ''}
                    onChange={(e:any) => setEditingUser({...editingUser, whatsapp: e.target.value})}
                  />
                  <Input
                    label="Teléfono"
                    placeholder="+54 9 11 1234-5678"
                    value={editingUser.phone || ''}
                    onChange={(e:any) => setEditingUser({...editingUser, phone: e.target.value})}
                  />
                  <div>
                      <label className="block text-sm font-bold mb-1 uppercase">Rol</label>
                      <select
                        className="w-full border-2 border-black p-2 bg-white"
                        value={editingUser.role || 'USER'}
                        onChange={(e:any) => setEditingUser({...editingUser, role: e.target.value as UserRole})}
                      >
                          <option value="USER">USER</option>
                          <option value="ADMIN">ADMIN</option>
                          <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                          <option value="EMPRENDEDOR">EMPRENDEDOR</option>
                      </select>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer p-2 bg-gray-50 border border-black font-bold">
                    <input
                      type="checkbox"
                      className="w-5 h-5 accent-torami-red"
                      checked={editingUser.entryAuthorized || false}
                      onChange={(e) => setEditingUser({...editingUser, entryAuthorized: e.target.checked})}
                    />
                    Entrada Autorizada
                  </label>
                  <Button type="submit" className="w-full">Guardar Cambios</Button>
              </form>
          </Modal>
      )}

      {/* OFFICIAL GALLERY UPLOAD MODAL */}
      {showOfficialUpload && (
          <Modal title="📸 Subir Foto Oficial" onClose={() => {
              setShowOfficialUpload(false);
              setOfficialUploadData({ eventId: '', description: '', url: '' });
          }}>
              <form onSubmit={async (e) => {
                  e.preventDefault();
                  if (!officialUploadData.url || !officialUploadData.eventId) {
                      alert('⚠️ Debés seleccionar un evento y subir una foto');
                      return;
                  }

                  // Close modal immediately
                  setShowOfficialUpload(false);
                  const uploadedData = { ...officialUploadData };
                  setOfficialUploadData({ eventId: '', description: '', url: '' });

                  // 1. Optimistically add to UI (we'll get the real ID from backend)
                  const tempPhoto = {
                      id: 'temp-' + Date.now(),
                      ...uploadedData,
                      isOfficial: true,
                      approved: true,
                      status: 'approved' as const,
                      userId: user?.id,
                      user: user,
                      event: events.find(e => e.id === uploadedData.eventId),
                      createdAt: new Date().toISOString(),
                      updatedAt: new Date().toISOString()
                  };
                  setOfficialGallery([tempPhoto, ...officialGallery]);

                  // 2. Send to backend in background
                  addOfficialGalleryItem(uploadedData)
                      .then(() => {
                          // Refresh to get real data from backend (with real ID, etc.)
                          refreshCurrentTab();
                      })
                      .catch((error) => {
                          console.error('Error uploading official photo:', error);
                          alert('❌ Error al subir la foto oficial. Recargando...');
                          refreshCurrentTab();
                      });
              }} className="space-y-4">
                  <div>
                      <label className="block text-sm font-bold mb-1 uppercase">Evento *</label>
                      <select
                        className="w-full border-2 border-black p-2 bg-white"
                        required
                        value={officialUploadData.eventId}
                        onChange={(e) => setOfficialUploadData({...officialUploadData, eventId: e.target.value})}
                      >
                          <option value="">Seleccioná un evento...</option>
                          {events.map(ev => <option key={ev.id} value={ev.id}>{ev.title}</option>)}
                      </select>
                  </div>

                  <div>
                      <label className="block text-sm font-bold mb-1 uppercase">Foto *</label>
                      <div className="border-2 border-dashed border-gray-400 bg-gray-50 p-4 text-center cursor-pointer hover:bg-gray-100 transition-colors relative">
                          <input
                            type="file"
                            accept="image/*"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                    const reader = new FileReader();
                                    reader.onloadend = () => {
                                        setOfficialUploadData(prev => ({ ...prev, url: reader.result as string }));
                                    };
                                    reader.readAsDataURL(e.target.files[0]);
                                }
                            }}
                            required={!officialUploadData.url}
                          />
                          {officialUploadData.url ? (
                              <img src={officialUploadData.url} alt="Preview" className="h-48 mx-auto object-contain shadow-sm" />
                          ) : (
                              <div className="text-gray-500 py-8">
                                  <Image className="mx-auto mb-2" size={32} />
                                  <span className="text-sm font-bold uppercase">Hacé clic para seleccionar imagen</span>
                              </div>
                          )}
                      </div>
                  </div>

                  <div>
                      <label className="block text-sm font-bold mb-1 uppercase">Descripción *</label>
                      <textarea
                        className="w-full border-2 border-black p-2"
                        rows={3}
                        placeholder="Describí la foto..."
                        value={officialUploadData.description}
                        onChange={(e) => setOfficialUploadData({...officialUploadData, description: e.target.value})}
                        required
                      ></textarea>
                  </div>

                  <Button type="submit" className="w-full">
                      <Upload size={18} className="mr-2 inline" /> Publicar Foto Oficial
                  </Button>
                  <p className="text-xs text-gray-500 text-center italic">
                      Las fotos oficiales se publican inmediatamente sin moderación
                  </p>
              </form>
          </Modal>
      )}

      {/* IMAGE VIEWER MODAL */}
      {viewImage && (
          <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4 backdrop-blur-sm" onClick={() => setViewImage(null)}>
              <div className="max-w-4xl max-h-[90vh] relative">
                  <button
                      onClick={() => setViewImage(null)}
                      className="absolute -top-10 right-0 text-white hover:text-gray-300 bg-black bg-opacity-50 rounded-full p-2"
                  >
                      <X size={24} />
                  </button>
                  <img
                      src={viewImage}
                      alt="Vista completa"
                      className="max-w-full max-h-[90vh] object-contain border-4 border-white shadow-2xl"
                      onClick={(e) => e.stopPropagation()}
                  />
              </div>
          </div>
      )}
    </div>
  );
};
