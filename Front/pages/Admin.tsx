import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../App';
import { UserRole, StandApplication, Event, Sponsor, Giveaway, AppConfig, CosplayRegistration, CosplayGuest, GalleryItem, User } from '../types';
import { SectionTitle, MangaCard, Badge, Button, Input } from '../components/UI';
import {
  getStats, getStandApplications, updateStandStatus, getConfig, updateConfig,
  getEvents, saveEvent, deleteEvent,
  getSponsors, saveSponsor, deleteSponsor,
  getGiveaways, saveGiveaway, deleteGiveaway,
  getGallery, getOfficialGallery, approveGalleryItem, deleteGalleryItem, updateGalleryItem, rejectGalleryItem, addOfficialGalleryItem,
  addStandMessage, getCosplayRegistrations, updateCosplayStatus, addCosplayMessage,
  getCosplayGuests, updateCosplayGuestStatus, addCosplayGuestMessage, deleteCosplayGuest,
  getUnreadNotificationCount, markAllNotificationsAsRead,
  getAllUsers, updateUser, deleteUser
} from '../services/data';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Plus, Edit, Trash2, Check, X, Ghost, Image, Gift, Calendar, Store, DollarSign, Upload, ExternalLink, MessageCircle, Send, ZoomIn, Save, AlertTriangle, RefreshCw, Link as LinkIcon, Film, Paperclip, Trophy, Eye, Mic2, Phone, Users, Sparkles, Star, Clock } from 'lucide-react';

// --- Helper Components for Modals ---
const Modal = ({ title, onClose, children }: { title: string, onClose: () => void, children: React.ReactNode }) => (
  <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-2 sm:p-4 backdrop-blur-sm">
    <div className="bg-white border-2 border-black shadow-manga w-full max-w-lg max-h-[95vh] sm:max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200 flex flex-col">
      <div className="flex justify-between items-center bg-black text-white p-3 sm:p-4 sticky top-0 z-10 flex-shrink-0">
        <h3 className="font-display text-lg sm:text-xl">{title}</h3>
        <button onClick={onClose}><X size={20} className="sm:w-6 sm:h-6" /></button>
      </div>
      <div className="p-4 sm:p-6 flex-grow overflow-y-auto">
        {children}
      </div>
    </div>
  </div>
);

// Special wider modal for photo moderation
const PhotoModal = ({ title, onClose, children }: { title: string, onClose: () => void, children: React.ReactNode }) => (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-2 sm:p-4 backdrop-blur-md">
      <div className="bg-white border-2 border-black shadow-manga w-full max-w-4xl max-h-[95vh] overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col">
        <div className="flex justify-between items-center bg-black text-white p-3 sm:p-4 sticky top-0 z-10 flex-shrink-0">
          <h3 className="font-display text-lg sm:text-xl">{title}</h3>
          <button onClick={onClose}><X size={20} className="sm:w-6 sm:h-6" /></button>
        </div>
        <div className="flex-grow overflow-y-auto p-0 flex flex-col md:flex-row">
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
                 className="flex-grow border-2 border-black p-2 text-sm focus:outline-none" 
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


export const Admin = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard'|'stands'|'events'|'sponsors'|'giveaways'|'gallery'|'officialgallery'|'config'|'cosplay'|'users'>('dashboard');

  // Data State
  const [stats, setStats] = useState<any>(null);
  const [stands, setStands] = useState<StandApplication[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [cosplayers, setCosplayers] = useState<CosplayRegistration[]>([]);
  const [cosplayGuests, setCosplayGuests] = useState<CosplayGuest[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [giveaways, setGiveaways] = useState<Giveaway[]>([]);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [officialGallery, setOfficialGallery] = useState<GalleryItem[]>([]);
  const [config, setConfig] = useState<AppConfig>({ donationsEnabled: false, paymentLink: '', aliasCbu: '', qrImage: '', homeGalleryImages: [], heroTitle: '', heroSubtitle: '', heroDateText: '', donationTitle: '', donationDescription: '', donationImage: '', donationGoal: undefined });
  const [configNotice, setConfigNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isTogglingDonations, setIsTogglingDonations] = useState(false);

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

  // Gallery Moderation State
  const [selectedPhoto, setSelectedPhoto] = useState<GalleryItem | null>(null);
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Official Gallery Upload State
  const [showOfficialUpload, setShowOfficialUpload] = useState(false);
  const [officialUploadData, setOfficialUploadData] = useState({ eventId: '', description: '', url: '' });

  // Carga datos específicos del tab activo (optimizado para reducir requests innecesarios)
  const loadTabData = (tab: string, updateOpenChat = false) => {
    console.log('🔄 Loading data for tab:', tab);

    switch (tab) {
      case 'dashboard':
        // Dashboard necesita stats y notificaciones
        getStats().then((data) => {
          console.log('📊 Stats from backend:', data);
          setStats(data);
        }).catch((err) => {
          console.error('Error fetching stats:', err);
          setStats({ users: { total: 0 }, events: { total: 0 }, stands: { pending: 0 }, giveaways: { active: 0 } });
        });
        getUnreadNotificationCount().then((data: any) => setUnreadCount(data.count));
        break;

      case 'events':
        getEvents().then((data) => {
          console.log('📅 Events from backend:', data);
          setEvents(data);
        });
        break;

      case 'stands':
        getStandApplications().then((data) => {
          setStands(data);
          if (updateOpenChat && chatStandRef.current) {
            const updatedStand = data.find(s => s.id === chatStandRef.current!.id);
            if (updatedStand) setChatStand(updatedStand);
          }
        });
        break;

      case 'cosplay':
        getCosplayRegistrations().then((data) => {
          setCosplayers(data);
          if (updateOpenChat && chatCosplayRef.current) {
            const updatedCos = data.find(c => c.id === chatCosplayRef.current!.id);
            if (updatedCos) setChatCosplay(updatedCos);
          }
        });
        break;

      case 'cosplayguest':
        getCosplayGuests().then((data) => {
          setCosplayGuests(data);
          if (updateOpenChat && chatCosplayRef.current) {
            // Check if the active chat is a guest (has assignedNumber)
            const isGuest = (chatCosplayRef.current as any).assignedNumber !== undefined;
            if (isGuest) {
              const updatedGuest = data.find(g => g.id === chatCosplayRef.current!.id);
              if (updatedGuest) setChatCosplay(updatedGuest as any);
            }
          }
        });
        break;

      case 'gallery':
        getGallery().then(setGallery);
        break;

      case 'officialgallery':
        getOfficialGallery().then(setOfficialGallery);
        break;

      case 'giveaways':
        getGiveaways().then(setGiveaways);
        break;

      case 'sponsors':
        getSponsors().then(setSponsors);
        break;

      case 'users':
        getAllUsers().then((data: User[]) => setUsers(data));
        break;

      case 'config':
        getConfig().then(setConfig);
        break;

      default:
        console.warn('Unknown tab:', tab);
    }
  };

  // Helper: Recarga solo el tab actual (optimizado)
  const refreshCurrentTab = (updateOpenChat = false) => {
    loadTabData(activeTab, updateOpenChat);
  };

  // Función legacy para refresh manual (cuando se necesite recargar todo)
  const refreshData = (updateOpenChat = false) => {
    console.log('⚠️ refreshData() - Loading ALL data (use loadTabData() instead)');
    getStats().then((data) => {
      console.log('📊 Stats from backend:', data);
      setStats(data);
    }).catch((err) => {
      console.error('Error fetching stats:', err);
      setStats({ users: { total: 0 }, events: { total: 0 }, stands: { pending: 0 }, giveaways: { active: 0 } });
    });
    getStandApplications().then((data) => {
        setStands(data);
        if (updateOpenChat && chatStandRef.current) {
            const updatedStand = data.find(s => s.id === chatStandRef.current!.id);
            if (updatedStand) setChatStand(updatedStand);
        }
    });
    getCosplayRegistrations().then((data) => {
        setCosplayers(data);
        if (updateOpenChat && chatCosplayRef.current) {
            const updatedCos = data.find(c => c.id === chatCosplayRef.current!.id);
            if(updatedCos) setChatCosplay(updatedCos);
        }
    });
    getCosplayGuests().then(setCosplayGuests);
    getEvents().then((data) => {
      console.log('📅 Events from backend:', data);
      setEvents(data);
    });
    getSponsors().then(setSponsors);
    getGiveaways().then(setGiveaways);
    getGallery().then(setGallery);
    getOfficialGallery().then(setOfficialGallery);
    getConfig().then(setConfig);
    getAllUsers().then((data: User[]) => setUsers(data));
    getUnreadNotificationCount().then((data: any) => setUnreadCount(data.count));
  };

  // ✅ Solo carga datos del tab activo (optimizado)
  useEffect(() => {
    loadTabData(activeTab);
  }, [activeTab]);

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

  // Auto-refresh chat messages every 10 SECONDS when chat is open (chat needs faster updates)
  useEffect(() => {
    if (!chatStand && !chatCosplay) return;

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

    // Initial refresh with chat update enabled
    loadTabData(tabToRefresh, true);

    // Set up polling interval with chat update enabled
    const intervalId = setInterval(() => {
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

  // Cosplay
  const handleCosplayStatus = async (id: string, status: 'Confirmado') => {
    await updateCosplayStatus(id, status);
    refreshCurrentTab();
    if (viewCosplay && viewCosplay.id === id) setViewCosplay(null); // Close modal if modifying current
  };

  const handleExecuteCosplayRejection = async () => {
      if (!viewCosplay) return;

      // 1. Update status
      await updateCosplayStatus(viewCosplay.id, 'Rechazado');
      
      // 2. Send Chat Message if reason is provided
      if (cosplayRejectionReason.trim()) {
          const reasonMsg = `⚠️ TU INSCRIPCIÓN FUE RECHAZADA.\n\nMotivo: ${cosplayRejectionReason}\n\nPor favor, corregí lo necesario y avisanos por este chat.`;
          await addCosplayMessage(viewCosplay.id, reasonMsg, 'ADMIN');
      }

      // 3. Cleanup and refresh
      setIsRejectingCosplay(false);
      setCosplayRejectionReason('');
      refreshCurrentTab();
      
      // 4. Close modal
      setViewCosplay(null);
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
        // 1. Update UI immediately (optimistic)
        const updatedPhoto = { ...selectedPhoto, status: 'approved' as const, approved: true };
        setGallery(gallery.map(p => p.id === selectedPhoto.id ? updatedPhoto : p));

        // If photo is official, also add to official gallery
        if (selectedPhoto.isOfficial) {
            setOfficialGallery([...officialGallery, updatedPhoto]);
        }

        setSelectedPhoto(null);

        // 2. Send to backend in background
        approveGalleryItem(selectedPhoto.id).catch((error) => {
          console.error('Error aprobando foto:', error);
          alert('Error al aprobar la foto. Recargando...');
          refreshCurrentTab();
        });
    }
  };

  const handleGalleryReject = async () => {
      if (selectedPhoto && rejectionReason.trim()) {
          // 1. Update UI immediately (optimistic)
          const updatedPhoto = { ...selectedPhoto, status: 'rejected' as const, approved: false, feedback: rejectionReason };
          setGallery(gallery.map(p => p.id === selectedPhoto.id ? updatedPhoto : p));
          setSelectedPhoto(null);
          setIsRejecting(false);
          setRejectionReason('');

          // 2. Send to backend in background
          rejectGalleryItem(selectedPhoto.id, rejectionReason).catch((error) => {
              console.error('Error rechazando foto:', error);
              alert('Error: ' + (error?.message || 'No se pudo rechazar la foto. Recargando...'));
              refreshCurrentTab();
          });
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

      console.log('💾 Guardando config:', {
        homeGalleryImages: configToSave.homeGalleryImages?.length || 0,
        fullConfig: configToSave
      });

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
              <div className="flex-grow min-h-[250px]">
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
                            <img src={ev.images[0] || 'https://via.placeholder.com/100'} alt={ev.title} className="w-12 h-12 sm:w-16 sm:h-16 object-cover border border-black flex-shrink-0" />
                            <div className="flex-grow min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <h4 className="font-bold text-base sm:text-lg break-words">{ev.title}</h4>
                                    {ev.isFeatured && <Badge color="blue">Destacado</Badge>}
                                    {ev.isPast && <Badge color="purple">Pasado</Badge>}
                                </div>
                                <div className="text-xs sm:text-sm text-gray-600 flex flex-col sm:flex-row gap-1 sm:gap-4 mt-1">
                                    <span className="whitespace-nowrap"><Calendar size={14} className="inline"/> {new Date(ev.date).toLocaleDateString('es-AR')}</span>
                                    <span className="break-words">{ev.location}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-2 w-full md:w-auto md:flex-shrink-0">
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
        <div className="animate-in fade-in -mx-2 sm:mx-0">
          <div className="overflow-x-auto">
            <table className="w-full border-2 border-black bg-white text-sm shadow-manga min-w-[800px]">
              <thead>
                <tr className="bg-black text-white text-left">
                  <th className="p-2 sm:p-3 whitespace-nowrap">Marca</th>
                  <th className="p-2 sm:p-3 whitespace-nowrap">Tipo</th>
                  <th className="p-2 sm:p-3 whitespace-nowrap">Evento</th>
                  <th className="p-2 sm:p-3 whitespace-nowrap">Contacto</th>
                  <th className="p-2 sm:p-3 whitespace-nowrap">WhatsApp</th>
                  <th className="p-2 sm:p-3 whitespace-nowrap">Estado</th>
                  <th className="p-2 sm:p-3 whitespace-nowrap">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {stands.map(stand => (
                  <tr key={stand.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="p-2 sm:p-3 font-bold whitespace-nowrap">{stand.brandName}</td>
                    <td className="p-2 sm:p-3 whitespace-nowrap">{stand.type}</td>
                    <td className="p-2 sm:p-3">
                      {stand.event ? (
                        <div>
                          <div className="font-medium whitespace-nowrap">{stand.event.title}</div>
                          <div className="text-xs text-gray-500 whitespace-nowrap">{new Date(stand.event.date).toLocaleDateString('es-AR')}</div>
                        </div>
                      ) : (
                        <span className="text-xs text-red-500 italic whitespace-nowrap">Sin evento asignado</span>
                      )}
                    </td>
                    <td className="p-2 sm:p-3">
                      <div className="whitespace-nowrap">{stand.contactName}</div>
                      <div className="text-xs text-gray-500 whitespace-nowrap">{stand.email}</div>
                    </td>
                    <td className="p-2 sm:p-3 font-mono whitespace-nowrap">{stand.phone}</td>
                    <td className="p-2 sm:p-3">
                      <Badge color={stand.status === 'Pendiente' ? 'blue' : stand.status === 'Aprobada' ? 'red' : 'purple'}>
                        {stand.status}
                      </Badge>
                    </td>
                    <td className="p-2 sm:p-3">
                      <div className="flex gap-1 sm:gap-2 items-center whitespace-nowrap">
                        <button onClick={() => setViewStand(stand)} className="bg-gray-100 text-gray-700 p-1 sm:p-2 rounded hover:bg-gray-200 border border-gray-300" title="Ver Detalle"><Eye size={16} /></button>
                        <button onClick={() => setChatStand(stand)} className="bg-blue-50 text-blue-600 p-1 sm:p-2 rounded hover:bg-blue-100 border border-blue-200" title="Chat"><MessageCircle size={16} /></button>
                        {stand.status === 'Pendiente' && (
                          <>
                            <button onClick={() => handleStandStatus(stand.id, 'Aprobada')} className="text-green-600 bg-green-50 p-1 rounded hover:bg-green-100"><Check size={16}/></button>
                            <button onClick={() => { setViewStand(stand); setIsRejectingStand(true); }} className="text-red-600 bg-red-50 p-1 rounded hover:bg-red-100"><X size={16}/></button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- COSPLAY LIST --- */}
      {activeTab === 'cosplay' && (
        <div className="animate-in fade-in -mx-2 sm:mx-0">
           <div className="flex justify-between mb-4 px-2 sm:px-0">
                <h3 className="font-display text-xl sm:text-2xl">Inscriptos Cosplay</h3>
           </div>
          <div className="overflow-x-auto">
            <table className="w-full border-2 border-black bg-white text-sm shadow-manga min-w-[800px]">
              <thead>
                <tr className="bg-black text-white text-left">
                  <th className="p-2 sm:p-3 whitespace-nowrap">Personaje</th>
                  <th className="p-2 sm:p-3 whitespace-nowrap">Participante</th>
                  <th className="p-2 sm:p-3 whitespace-nowrap">Evento</th>
                  <th className="p-2 sm:p-3 whitespace-nowrap">Categoría</th>
                  <th className="p-2 sm:p-3 whitespace-nowrap">Estado</th>
                  <th className="p-2 sm:p-3 whitespace-nowrap">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {cosplayers.map(cos => (
                  <tr key={cos.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="p-2 sm:p-3">
                      <div className="font-bold whitespace-nowrap">{cos.characterName}</div>
                      <div className="text-xs text-gray-500 whitespace-nowrap">{cos.seriesName}</div>
                    </td>
                    <td className="p-2 sm:p-3">
                        <div className="whitespace-nowrap">{cos.participantName}</div>
                        <div className="text-xs text-gray-500 italic whitespace-nowrap">{cos.nickname}</div>
                    </td>
                    <td className="p-2 sm:p-3">
                      {cos.event ? (
                        <div>
                          <div className="font-medium whitespace-nowrap">{cos.event.title}</div>
                          <div className="text-xs text-gray-500 whitespace-nowrap">{new Date(cos.event.date).toLocaleDateString('es-AR')}</div>
                        </div>
                      ) : (
                        <span className="text-xs text-red-500 italic whitespace-nowrap">Sin evento</span>
                      )}
                    </td>
                    <td className="p-2 sm:p-3"><Badge color="blue">{cos.category}</Badge></td>
                    <td className="p-2 sm:p-3">
                        <Badge color={cos.status === 'Inscripto' ? 'yellow' : cos.status === 'Confirmado' ? 'green' : 'red'}>
                            {cos.status}
                        </Badge>
                    </td>
                    <td className="p-2 sm:p-3">
                       <button
                          onClick={() => setViewCosplay(cos)}
                          className="bg-gray-100 text-gray-700 p-1 sm:p-2 rounded hover:bg-gray-200 border border-gray-300 flex items-center gap-1 text-xs font-bold whitespace-nowrap"
                       >
                          <Eye size={16} /> Ver
                       </button>
                    </td>
                  </tr>
                ))}
                {cosplayers.length === 0 && (
                    <tr>
                        <td colSpan={6} className="p-4 text-center text-gray-500 italic">No hay inscriptos aún.</td>
                    </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- COSPLAY INVITADOS --- */}
      {activeTab === 'cosplayguest' && (
        <div className="animate-in fade-in -mx-2 sm:mx-0">
           <div className="flex justify-between mb-4 px-2 sm:px-0">
                <h3 className="font-display text-xl sm:text-2xl flex items-center gap-2">
                  <Star size={24} className="text-yellow-500 fill-current" />
                  Cosplay Invitados
                </h3>
           </div>
          <div className="overflow-x-auto">
            <table className="w-full border-2 border-black bg-white text-sm shadow-manga min-w-[800px]">
              <thead>
                <tr className="bg-black text-white text-left">
                  <th className="p-2 sm:p-3 whitespace-nowrap">#</th>
                  <th className="p-2 sm:p-3 whitespace-nowrap">Personaje</th>
                  <th className="p-2 sm:p-3 whitespace-nowrap">Participante</th>
                  <th className="p-2 sm:p-3 whitespace-nowrap">Evento</th>
                  <th className="p-2 sm:p-3 whitespace-nowrap">Categoría</th>
                  <th className="p-2 sm:p-3 whitespace-nowrap">Estado</th>
                  <th className="p-2 sm:p-3 whitespace-nowrap">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {cosplayGuests.map(guest => (
                  <tr key={guest.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="p-2 sm:p-3">
                      <div className="flex items-center justify-center w-10 h-10 bg-yellow-400 border-2 border-black font-bold text-lg">
                        {guest.assignedNumber}
                      </div>
                    </td>
                    <td className="p-2 sm:p-3">
                      <div className="font-bold whitespace-nowrap">{guest.characterName}</div>
                      <div className="text-xs text-gray-500 whitespace-nowrap">{guest.seriesName}</div>
                    </td>
                    <td className="p-2 sm:p-3">
                        <div className="whitespace-nowrap">{guest.participantName}</div>
                        <div className="text-xs text-gray-500 italic whitespace-nowrap">{guest.nickname}</div>
                    </td>
                    <td className="p-2 sm:p-3">
                      <div className="font-medium whitespace-nowrap">
                        {events.find(e => e.id === guest.eventId)?.title || 'Sin evento'}
                      </div>
                    </td>
                    <td className="p-2 sm:p-3"><Badge color="blue">{guest.category}</Badge></td>
                    <td className="p-2 sm:p-3">
                        <Badge color={guest.status === 'Inscripto' ? 'yellow' : guest.status === 'Confirmado' ? 'green' : 'red'}>
                            {guest.status}
                        </Badge>
                    </td>
                    <td className="p-2 sm:p-3">
                       <button
                          onClick={() => {
                            // Set up modal to view guest details
                            setViewCosplay(guest as any);
                          }}
                          className="bg-gray-100 text-gray-700 p-1 sm:p-2 rounded hover:bg-gray-200 border border-gray-300 flex items-center gap-1 text-xs font-bold whitespace-nowrap"
                       >
                          <Eye size={16} /> Ver
                       </button>
                    </td>
                  </tr>
                ))}
                {cosplayGuests.length === 0 && (
                    <tr>
                        <td colSpan={7} className="p-4 text-center text-gray-500 italic">No hay invitados aún.</td>
                    </tr>
                )}
              </tbody>
            </table>
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
                            img.status === 'approved' ? 'border-green-500' :
                            img.status === 'rejected' ? 'border-red-500' : 'border-yellow-400'
                        } p-1 cursor-pointer hover:shadow-manga transition-all`}
                      >
                          <img src={img.url} alt="Gallery" className="w-full h-40 object-cover" />
                          <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                               <ZoomIn className="text-white w-8 h-8 drop-shadow-lg" />
                          </div>
                          <div className={`absolute top-2 right-2 px-2 py-1 text-xs font-bold text-white ${
                              img.status === 'approved' ? 'bg-green-600' :
                              img.status === 'rejected' ? 'bg-red-600' : 'bg-yellow-600'
                          }`}>
                              {img.status === 'approved' ? 'Aprobada' : img.status === 'rejected' ? 'Rechazada' : 'Pendiente'}
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
                        <img src={sp.logoUrl} alt={sp.name} className="w-12 h-12 sm:w-16 sm:h-16 object-contain border border-gray-200 flex-shrink-0" />
                        <div className="flex-grow min-w-0">
                            <h4 className="font-bold text-sm sm:text-base break-words">{sp.name}</h4>
                            <div className="text-xs text-gray-500">{sp.category}</div>
                            <Badge color={sp.active ? 'red' : 'purple'}>{sp.active ? 'Activo' : 'Inactivo'}</Badge>
                        </div>
                        <div className="flex flex-row sm:flex-col gap-2 sm:gap-1 flex-shrink-0">
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
                                   <img src={g.images[0]} alt={g.title} className="w-16 h-16 sm:w-20 sm:h-20 object-cover border border-black flex-shrink-0" />
                                )}
                                <div className="flex-grow min-w-0">
                                    <h4 className="font-bold text-base sm:text-lg break-words">{g.title}</h4>
                                    <p className="text-xs sm:text-sm text-gray-600 break-words">Premio: {g.prize}</p>
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
            <div className="animate-in fade-in -mx-2 sm:mx-0">
              <div className="overflow-x-auto">
                <table className="w-full border-2 border-black bg-white text-sm shadow-manga min-w-[900px]">
                  <thead>
                    <tr className="bg-black text-white text-left">
                      <th className="p-2 sm:p-3 whitespace-nowrap">Nombre</th>
                      <th className="p-2 sm:p-3 whitespace-nowrap">Email</th>
                      <th className="p-2 sm:p-3 whitespace-nowrap">WhatsApp</th>
                      <th className="p-2 sm:p-3 whitespace-nowrap">Rol</th>
                      <th className="p-2 sm:p-3 whitespace-nowrap">Entrada</th>
                      <th className="p-2 sm:p-3 whitespace-nowrap">Fecha</th>
                      <th className="p-2 sm:p-3 whitespace-nowrap">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="p-2 sm:p-3 font-bold whitespace-nowrap">{u.name}</td>
                        <td className="p-2 sm:p-3 whitespace-nowrap text-xs">{u.email}</td>
                        <td className="p-2 sm:p-3 whitespace-nowrap font-mono text-xs">
                          {u.whatsapp ? (
                            <a href={`https://wa.me/${u.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:text-green-700 flex items-center gap-1">
                              <Phone size={12} />
                              {u.whatsapp}
                            </a>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="p-2 sm:p-3">
                          <Badge color={u.role === 'SUPER_ADMIN' ? 'red' : u.role === 'ADMIN' ? 'blue' : 'purple'}>
                            {u.role}
                          </Badge>
                        </td>
                        <td className="p-2 sm:p-3 text-center">
                          {u.entryAuthorized ? (
                            <Check size={18} className="text-green-600 mx-auto" />
                          ) : (
                            <X size={18} className="text-gray-400 mx-auto" />
                          )}
                        </td>
                        <td className="p-2 sm:p-3 whitespace-nowrap text-xs text-gray-500">
                          {u.createdAt ? new Date(u.createdAt).toLocaleDateString('es-AR') : '-'}
                        </td>
                        <td className="p-2 sm:p-3">
                          <div className="flex gap-1 sm:gap-2 items-center whitespace-nowrap">
                            <button
                              onClick={() => setEditingUser(u)}
                              className="bg-blue-50 text-blue-600 p-1 sm:p-2 rounded hover:bg-blue-100 border border-blue-200"
                              title="Editar usuario"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => {
                                updateUser(u.id, { entryAuthorized: !u.entryAuthorized }).then(() => refreshCurrentTab());
                              }}
                              className={`p-1 sm:p-2 rounded border ${u.entryAuthorized ? 'bg-red-50 text-red-600 border-red-200' : 'bg-green-50 text-green-600 border-green-200'}`}
                              title={u.entryAuthorized ? 'Revocar entrada' : 'Autorizar entrada'}
                            >
                              {u.entryAuthorized ? <X size={16} /> : <Check size={16} />}
                            </button>
                            {user?.role === 'SUPER_ADMIN' && u.id !== user.id && (
                              <button
                                onClick={() => {
                                  if (confirm(`¿Eliminar usuario ${u.name}? Esta acción no se puede deshacer.`)) {
                                    deleteUser(u.id).then(() => refreshCurrentTab());
                                  }
                                }}
                                className="bg-red-50 text-red-600 p-1 sm:p-2 rounded hover:bg-red-100 border border-red-200"
                                title="Eliminar usuario"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {users.length === 0 && (
                      <tr>
                        <td colSpan={7} className="p-4 text-center text-gray-500 italic">Cargando usuarios...</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
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
                            console.log('📸 Galería actualizada:', imgs.length, 'imágenes');
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

                {configNotice && (
                  <div className={`p-4 border-2 shadow-manga animate-in slide-in-from-top-2 flex items-start gap-3 ${configNotice.type === 'success' ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500'}`}>
                    {configNotice.type === 'success' ? (
                      <Check className="text-green-600 flex-shrink-0" size={24} />
                    ) : (
                      <AlertTriangle className="text-red-600 flex-shrink-0" size={24} />
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
                        <Badge color={viewStand.status === 'Pendiente' ? 'blue' : viewStand.status === 'Aprobada' ? 'red' : 'purple'}>
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
                 {viewStand.status !== 'Aprobada' && (
                     <div className="pt-4 border-t border-gray-200">
                        {isRejectingStand ? (
                            <div className="animate-in fade-in slide-in-from-bottom-2 bg-red-50 p-4 border border-red-200 rounded">
                                <label className="block text-sm font-bold mb-2 uppercase text-red-600 flex items-center gap-2">
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
                                {viewStand.status === 'Pendiente' && (
                                    <Button onClick={() => handleStandStatus(viewStand.id, 'Aprobada')} className="flex-1 bg-green-600 hover:bg-green-700 text-white border-green-800">
                                        Aprobar Stand
                                    </Button>
                                )}
                                {viewStand.status !== 'Rechazada' && (
                                    <Button onClick={() => setIsRejectingStand(true)} variant="outline" className="flex-1 text-red-600 border-red-600 hover:bg-red-50">
                                        Rechazar
                                    </Button>
                                )}
                            </div>
                        )}
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
                            <label className="block text-sm font-bold mb-2 uppercase text-red-600 flex items-center gap-2">
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
                     )}
                 </div>
              </div>
          </Modal>
      )}

      {/* SHARED CHAT MODAL (Works for Stand or Cosplay) */}
      {(chatStand || chatCosplay) && (
          <Modal title={`Chat con ${chatStand ? chatStand.brandName : chatCosplay?.participantName}`} onClose={() => {setChatStand(null); setChatCosplay(null); setChatImage(null);}}>
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
                  <div className="flex-grow overflow-y-auto space-y-4 p-2 mb-4" ref={chatScrollRef}>
                      {(chatStand ? chatStand.messages : chatCosplay?.messages || []).length === 0 && <div className="text-center text-gray-400 italic text-sm mt-10">No hay mensajes. Iniciá la conversación.</div>}
                      {(chatStand ? chatStand.messages : chatCosplay?.messages || []).map(msg => (
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
                        <span className="text-xs text-gray-500 italic flex-grow">Imagen adjunta</span>
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
                        className="flex-grow border-2 border-black p-2 focus:outline-none h-10" 
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
              <div className="w-full md:w-2/3 bg-black flex items-center justify-center p-2 sm:p-4 min-h-[200px] sm:min-h-[400px]">
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
                  </div>

                  <div className="mb-6 flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-sm text-gray-500 uppercase mb-2">Estado Actual</h4>
                      <Badge color={selectedPhoto.status === 'approved' ? 'green' : selectedPhoto.status === 'rejected' ? 'red' : 'yellow'}>
                        {selectedPhoto.status === 'approved' ? 'Aprobada' : selectedPhoto.status === 'rejected' ? 'Rechazada' : 'Pendiente'}
                      </Badge>
                    </div>
                  </div>

                  {selectedPhoto.feedback && (
                    <div className="mb-4 bg-red-50 p-3 border border-red-200 rounded">
                        <p className="text-xs font-bold text-red-700 uppercase flex items-center gap-1"><AlertTriangle size={12}/> Motivo de rechazo anterior:</p>
                        <p className="text-sm text-red-900 mt-1">{selectedPhoto.feedback}</p>
                    </div>
                  )}
                  
                  <form onSubmit={handleGallerySave} className="flex-grow flex flex-col">
                      <div className="mb-4 flex-grow">
                          <label className="block text-sm font-bold mb-1 uppercase">Descripción del Usuario</label>
                          <textarea 
                              className="w-full min-h-[100px] border-2 border-black p-3 focus:outline-none focus:shadow-manga resize-none bg-gray-50"
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
                              {selectedPhoto.status !== 'approved' && (
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
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-[60] p-4 backdrop-blur-md">
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
