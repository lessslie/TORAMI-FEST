import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../App';
import { SectionTitle, MangaCard, Badge, Button, Input } from '../components/UI';
import { getUserStands, getUserCosplays, addStandMessage, addCosplayMessage, getUserGallery, getUserGiveaways, updateUserProfile, validateStamp, getUnreadNotificationCount, markAllNotificationsAsRead } from '../services/data';
import { StandApplication, CosplayRegistration, GalleryItem, Giveaway } from '../types';
import { Store, Trophy, MessageCircle, X, Send, Clock, CheckCircle, XCircle, Image, Gift, User as UserIcon, AlertTriangle, Save, Camera, Ticket, QrCode, Sparkles, MapPin, ScanLine, Crown, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';

const Modal = ({ title, onClose, children }: { title: string, onClose: () => void, children: React.ReactNode }) => (
  <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
    <div className="bg-white border-2 border-black shadow-manga w-full max-w-lg max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200 flex flex-col">
      <div className="flex justify-between items-center bg-black text-white p-4 sticky top-0 z-10 flex-shrink-0">
        <h3 className="font-display text-xl">{title}</h3>
        <button onClick={onClose}><X size={24} /></button>
      </div>
      <div className="p-6 flex-grow overflow-y-auto">
        {children}
      </div>
    </div>
  </div>
);

export const UserDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'stands'|'cosplay'|'gallery'|'giveaways'|'profile'|'ticket'|'passport'>('stands');
  
  // Data State
  const [stands, setStands] = useState<StandApplication[]>([]);
  const [cosplays, setCosplays] = useState<CosplayRegistration[]>([]);
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [myGiveaways, setMyGiveaways] = useState<Giveaway[]>([]);
  
  // Stamp State
  const [stamps, setStamps] = useState<string[]>([]);
  const [stampCode, setStampCode] = useState('');
  const [stampMessage, setStampMessage] = useState<{text: string, type: 'success' | 'error'} | null>(null);
  
  // Profile Edit State
  const [profileData, setProfileData] = useState({ name: '', email: '', whatsapp: '' });
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // Chat State
  const [activeChatStand, setActiveChatStand] = useState<StandApplication | null>(null);
  const [activeChatCosplay, setActiveChatCosplay] = useState<CosplayRegistration | null>(null);
  const [chatMessage, setChatMessage] = useState('');
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const chatStandRef = useRef<StandApplication | null>(null);
  const chatCosplayRef = useRef<CosplayRegistration | null>(null);

  // Notification State
  const [unreadCount, setUnreadCount] = useState(0);

  // Image Modal State
  const [viewImage, setViewImage] = useState<string | null>(null);

  const refreshData = (updateOpenChat = false) => {
      if (user) {
          getUserStands(user.id).then(data => {
              setStands(data);
              // Only update active chat if explicitly requested AND chat is currently open
              if (updateOpenChat && chatStandRef.current) {
                  const updated = data.find(s => s.id === chatStandRef.current!.id);
                  if (updated) setActiveChatStand(updated);
              }
          });
          getUserCosplays(user.id).then(data => {
              setCosplays(data);
              // Only update active chat if explicitly requested AND chat is currently open
              if (updateOpenChat && chatCosplayRef.current) {
                  const updated = data.find(c => c.id === chatCosplayRef.current!.id);
                  if (updated) setActiveChatCosplay(updated);
              }
          });
          getUserGallery(user.id).then(setGalleryItems);
          getUserGiveaways(user.id).then(setMyGiveaways);
          getUnreadNotificationCount().then((data: any) => setUnreadCount(data.count));
          setProfileData({ name: user.name, email: user.email, whatsapp: user.whatsapp || '' });

          const currentStamps = user.stamps || [];
          setStamps(currentStamps);
      }
  };

  useEffect(() => {
    refreshData();
  }, [user]);

  // Sync refs with state
  useEffect(() => {
    chatStandRef.current = activeChatStand;
    chatCosplayRef.current = activeChatCosplay;
  }, [activeChatStand, activeChatCosplay]);

  // Auto-refresh notifications every 10 seconds
  useEffect(() => {
    if (!user) return;

    const intervalId = setInterval(() => {
      getUnreadNotificationCount().then((data: any) => setUnreadCount(data.count));
    }, 10000); // Check every 10 seconds

    return () => clearInterval(intervalId);
  }, [user]);

  // Mark all notifications as read when opening chat
  useEffect(() => {
    if (activeChatStand || activeChatCosplay) {
      markAllNotificationsAsRead().then(() => {
        setUnreadCount(0);
      });
    }
  }, [activeChatStand?.id, activeChatCosplay?.id]);

  // Auto-refresh chat messages every 5 seconds when chat is open
  useEffect(() => {
    const chatIsOpen = activeChatStand !== null || activeChatCosplay !== null;
    if (!chatIsOpen) return;

    // Initial refresh with chat update enabled
    refreshData(true);

    // Set up polling interval with chat update enabled
    const intervalId = setInterval(() => {
      refreshData(true);
    }, 5000); // Refresh every 5 seconds

    // Cleanup on unmount or when chat closes
    return () => clearInterval(intervalId);
  }, [activeChatStand !== null, activeChatCosplay !== null]);

  useEffect(() => {
    if (chatScrollRef.current) {
        chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [activeChatStand?.messages, activeChatCosplay?.messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!chatMessage.trim()) return;

      if (activeChatStand) {
          await addStandMessage(activeChatStand.id, chatMessage, 'USER');
      } else if (activeChatCosplay) {
          await addCosplayMessage(activeChatCosplay.id, chatMessage, 'USER');
      }
      setChatMessage('');
      refreshData(true);
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
      e.preventDefault();
      if (user) {
          await updateUserProfile({ ...user, name: profileData.name, email: profileData.email, whatsapp: profileData.whatsapp });
          setIsEditingProfile(false);
          alert('Perfil actualizado (Simulado)');
      }
  };

  const handleStampSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if(!stampCode.trim()) return;
      
      const result = await validateStamp(stampCode.toUpperCase(), stamps);
      if (result.success && result.type) {
          const newStamps = [...stamps, result.type];
          setStamps(newStamps);
          // In a real app, update user in DB
          if (user) user.stamps = newStamps;
          setStampMessage({ text: result.message, type: 'success' });
          setStampCode('');
      } else {
          setStampMessage({ text: result.message, type: 'error' });
      }
      
      setTimeout(() => setStampMessage(null), 3000);
  };

  const StatusIcon = ({ status }: { status: string }) => {
      if (status === 'Aprobada' || status === 'Confirmado' || status === 'approved') return <CheckCircle className="text-green-600" />;
      if (status === 'Rechazada' || status === 'Rechazado' || status === 'rejected') return <XCircle className="text-red-600" />;
      return <Clock className="text-blue-600" />;
  };

  const TabButton = ({ id, label, icon: Icon, badge }: any) => (
      <button
         onClick={() => setActiveTab(id)}
         className={`flex-1 min-w-[80px] py-3 font-bold uppercase flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 border-b-4 transition-colors text-[10px] md:text-sm relative ${activeTab === id ? 'border-torami-red bg-gray-50 text-torami-red' : 'border-transparent text-gray-500 hover:text-black hover:bg-gray-50'}`}
      >
          <Icon size={18} /> <span>{label}</span>
          {badge > 0 && (
              <span className="absolute top-2 right-2 md:top-1 md:right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                  {badge > 9 ? '9+' : badge}
              </span>
          )}
      </button>
  );

  // Calculate unread messages for each category
  const getStandUnreadCount = () => {
    return stands.reduce((count, stand) => {
      const messages = stand.messages as any[] || [];
      const lastUserMessage = messages.filter(m => m.sender === 'USER').pop();
      const lastAdminMessage = messages.filter(m => m.sender === 'ADMIN').pop();

      // If there's an admin message after the last user message, count as unread
      if (lastAdminMessage && (!lastUserMessage || new Date(lastAdminMessage.timestamp) > new Date(lastUserMessage.timestamp))) {
        return count + 1;
      }
      return count;
    }, 0);
  };

  const getCosplayUnreadCount = () => {
    return cosplays.reduce((count, cosplay) => {
      const messages = cosplay.messages as any[] || [];
      const lastUserMessage = messages.filter(m => m.sender === 'USER').pop();
      const lastAdminMessage = messages.filter(m => m.sender === 'ADMIN').pop();

      // If there's an admin message after the last user message, count as unread
      if (lastAdminMessage && (!lastUserMessage || new Date(lastAdminMessage.timestamp) > new Date(lastUserMessage.timestamp))) {
        return count + 1;
      }
      return count;
    }, 0);
  };

  if (!user) return <div className="p-10 text-center">Inicia sesión para ver tu panel.</div>;

  const ticketLabel = user.ticketType || 'Entrada General';
  const isAuthorized = Boolean(user.entryAuthorized);
  const qrPayload = encodeURIComponent(JSON.stringify({ uid: user.id, ticket: ticketLabel, authorized: isAuthorized }));

  const StampSlot = ({ type, label, icon: Icon }: any) => {
      const isCollected = stamps.includes(type);
      return (
          <div className={`flex flex-col items-center justify-center p-2 rounded-full w-24 h-24 border-2 border-dashed transition-all ${isCollected ? 'bg-yellow-100 border-yellow-500 scale-110 shadow-lg' : 'bg-gray-50 border-gray-300 opacity-60'}`}>
              {isCollected ? (
                  <>
                    <Icon size={32} className="text-yellow-600 mb-1" />
                    <span className="text-[10px] font-bold uppercase text-yellow-800">{label}</span>
                    <CheckCircle size={12} className="text-green-600 absolute top-1 right-1" />
                  </>
              ) : (
                  <>
                    <Icon size={24} className="text-gray-400 mb-1" />
                    <span className="text-[10px] font-bold uppercase text-gray-400">{label}</span>
                  </>
              )}
          </div>
      );
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <SectionTitle>Panel de Usuario</SectionTitle>
      
      {/* Mobile-friendly horizontal scroll tab list */}
      <div className="bg-white border-2 border-black shadow-manga mb-8 overflow-x-auto scrollbar-hide">
         <div className="flex w-full min-w-max">
            {/* Temporarily hidden - will be enabled later */}
            {/* <TabButton id="ticket" label="Entrada" icon={Ticket} /> */}
            {/* <TabButton id="passport" label="Pasaporte" icon={ScanLine} /> */}
            <TabButton id="profile" label="Perfil" icon={UserIcon} />
            <TabButton id="stands" label="Stands" icon={Store} badge={getStandUnreadCount()} />
            <TabButton id="cosplay" label="Cosplay" icon={Trophy} badge={getCosplayUnreadCount()} />
            <TabButton id="gallery" label="Fotos" icon={Image} />
            <TabButton id="giveaways" label="Sorteos" icon={Gift} />
         </div>
      </div>

      <div className="min-h-[400px]">
          {/* TICKET TAB */}
          {activeTab === 'ticket' && (
              <div className="animate-in zoom-in-95 flex justify-center py-4">
                  <div className="w-full max-w-sm bg-white border-2 border-black relative overflow-hidden shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                      {/* Decorative header */}
                      <div className="bg-black text-white p-4 flex justify-between items-center bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
                          <span className="font-display text-2xl uppercase italic">Torami Fest</span>
                          <span className="text-xs border border-white px-2 py-1 rounded">28 MAR 2026</span>
                      </div>
                      
                      {/* Ticket Body */}
                      <div className="p-6 flex flex-col items-center text-center relative">
                          {/* Cutout circles */}
                          <div className="absolute top-1/2 -left-3 w-6 h-6 bg-halftone rounded-full border-r-2 border-black"></div>
                          <div className="absolute top-1/2 -right-3 w-6 h-6 bg-halftone rounded-full border-l-2 border-black"></div>
                          <div className="absolute top-1/2 left-0 w-full border-b-2 border-dashed border-gray-300 -z-10"></div>

                          <div className="mb-4 flex items-center gap-2">
                              <Badge color="blue">{ticketLabel}</Badge>
                              <Badge color={isAuthorized ? 'green' : 'yellow'}>
                                  {isAuthorized ? 'Autorizado' : 'Pendiente'}
                              </Badge>
                          </div>
                          
                          <h2 className="font-bold text-2xl uppercase mb-1">{user.name}</h2>
                          <p className="text-sm text-gray-500 mb-6">{user.email}</p>
                          
                          <div className="bg-white p-2 border-4 border-black mb-4">
                              <img 
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=170x170&data=${qrPayload}`} 
                                alt="QR Entrada" 
                                className="w-44 h-44"
                              />
                          </div>
                          <p className="text-[11px] uppercase font-mono tracking-widest text-gray-700">
                            ID: {user.id}-XF92
                          </p>
                          <p className={`text-xs font-bold mt-2 ${isAuthorized ? 'text-green-600' : 'text-yellow-600'}`}>
                            Estado: {isAuthorized ? 'Autorizado para ingresar' : 'Pendiente de pago/autorización'}
                          </p>
                      </div>

                      {/* Footer */}
                      <div className="bg-torami-red p-3 text-center">
                          <p className="text-white text-xs font-bold uppercase animate-pulse">Presentar en puerta</p>
                      </div>
                  </div>
              </div>
          )}

          {/* PASSPORT TAB (STAMP RALLY) */}
          {activeTab === 'passport' && (
              <div className="animate-in fade-in">
                  <MangaCard className="bg-[url('https://www.transparenttextures.com/patterns/graphy.png')] bg-blue-50 border-4 border-blue-900 mb-6">
                      <div className="text-center mb-8">
                          <h3 className="font-display text-3xl text-blue-900 mb-2 uppercase flex items-center justify-center gap-2">
                              <MapPin /> Torami Pasaporte
                          </h3>
                          <p className="text-blue-800 text-sm max-w-md mx-auto">
                              ¡Explora el evento! Encuentra los códigos QR ocultos en cada zona, escanéalos (ingresa el código) y completá tu pasaporte para ganar un premio.
                          </p>
                      </div>

                      <div className="flex flex-wrap justify-center gap-6 mb-8 relative z-10">
                          <StampSlot type="stage" label="Escenario" icon={Sparkles} />
                          <StampSlot type="gaming" label="Gaming" icon={Ticket} />
                          <StampSlot type="food" label="Comida" icon={Store} />
                          <StampSlot type="merch" label="Stands" icon={Gift} />
                      </div>

                      {/* Code Input */}
                      <div className="max-w-xs mx-auto bg-white p-4 border-2 border-black shadow-md">
                          <form onSubmit={handleStampSubmit}>
                              <label className="block text-xs font-bold mb-2 uppercase text-center">Ingresar Código de Zona</label>
                              <div className="flex gap-2">
                                  <input 
                                    type="text" 
                                    className="w-full border-2 border-gray-300 p-2 text-center uppercase font-mono placeholder:text-xs" 
                                    placeholder="EJ: TORAMI-FOOD"
                                    value={stampCode}
                                    onChange={(e) => setStampCode(e.target.value)}
                                  />
                                  <button type="submit" className="bg-blue-600 text-white p-2 hover:bg-blue-700">
                                      <QrCode size={20} />
                                  </button>
                              </div>
                              {stampMessage && (
                                  <p className={`text-xs font-bold text-center mt-2 ${stampMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                                      {stampMessage.text}
                                  </p>
                              )}
                          </form>
                      </div>

                      {stamps.length === 4 && (
                          <div className="mt-8 p-4 bg-yellow-300 border-2 border-black text-center animate-bounce-slow shadow-manga">
                              <h4 className="font-display text-xl flex items-center justify-center gap-2">
                                  <Crown /> ¡Pasaporte Completo!
                              </h4>
                              <p className="text-sm font-bold mb-2">Has desbloqueado el Wallpaper Exclusivo</p>
                              <Button className="text-xs py-2 px-4">Descargar Premio</Button>
                          </div>
                      )}
                  </MangaCard>
              </div>
          )}

          {/* PROFILE TAB */}
          {activeTab === 'profile' && (
              <div className="animate-in fade-in flex flex-col items-center">
                  <div className="w-full max-w-md bg-white border-2 border-black p-6 relative overflow-hidden shadow-manga">
                      {/* ID Card Design */}
                      <div className="absolute top-0 left-0 w-full h-24 bg-torami-red z-0"></div>
                      <div className="relative z-10 flex flex-col items-center">
                          <div className="w-32 h-32 rounded-full border-4 border-white bg-gray-200 mb-4 overflow-hidden shadow-md">
                              <img src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}&background=random`} alt="Avatar" className="w-full h-full object-cover" />
                          </div>
                          
                          {isEditingProfile ? (
                              <form onSubmit={handleProfileUpdate} className="w-full space-y-4">
                                  <Input label="Nombre" value={profileData.name} onChange={(e:any) => setProfileData({...profileData, name: e.target.value})} />
                                  <Input label="Email" value={profileData.email} onChange={(e:any) => setProfileData({...profileData, email: e.target.value})} />
                                  <Input
                                      label="WhatsApp"
                                      placeholder="+54 9 11 1234-5678"
                                      value={profileData.whatsapp || ''}
                                      onChange={(e:any) => setProfileData({...profileData, whatsapp: e.target.value})}
                                  />
                                  <div className="flex gap-2">
                                      <Button type="submit" className="w-full text-sm py-2">Guardar</Button>
                                      <Button type="button" variant="outline" className="w-full text-sm py-2" onClick={() => setIsEditingProfile(false)}>Cancelar</Button>
                                  </div>
                              </form>
                          ) : (
                              <>
                                <h2 className="font-display text-2xl uppercase mb-1">{user.name}</h2>
                                <Badge color="blue">{user.role}</Badge>
                                <div className="mt-6 w-full space-y-2 text-sm text-gray-600 border-t border-gray-200 pt-4">
                                    <div className="flex justify-between">
                                        <span className="font-bold">Email:</span>
                                        <span className="break-all">{user.email}</span>
                                    </div>
                                    {user.whatsapp && (
                                        <div className="flex justify-between items-center">
                                            <span className="font-bold">WhatsApp:</span>
                                            <a
                                                href={`https://wa.me/${user.whatsapp.replace(/\D/g, '')}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-1 text-green-600 hover:text-green-700 font-mono"
                                            >
                                                <Phone size={14} />
                                                {user.whatsapp}
                                            </a>
                                        </div>
                                    )}
                                    <div className="flex justify-between">
                                        <span className="font-bold">ID:</span>
                                        <span className="font-mono text-xs">{user.id}</span>
                                    </div>
                                </div>
                                <button onClick={() => setIsEditingProfile(true)} className="mt-6 text-xs text-gray-500 hover:text-torami-red underline">
                                    Editar Datos
                                </button>
                              </>
                          )}
                      </div>
                      
                      {/* Barcode Decoration */}
                      <div className="mt-6 h-8 bg-black w-full opacity-10"></div>
                      <div className="text-center text-[10px] text-gray-400 mt-1 uppercase tracking-widest">Torami Fest Official Member</div>
                  </div>
              </div>
          )}

          {/* STANDS TAB */}
          {activeTab === 'stands' && (
              <div className="space-y-4 animate-in fade-in">
                  {stands.length === 0 && (
                      <MangaCard className="text-center py-10 bg-gray-50">
                          <Store size={48} className="mx-auto text-gray-300 mb-4" />
                          <p className="text-gray-500 mb-4">No has solicitado ningún stand aún.</p>
                          <Link to="/quiero-un-stand">
                              <Button>¡Solicitar Stand!</Button>
                          </Link>
                      </MangaCard>
                  )}
                  {stands.map(stand => (
                      <MangaCard key={stand.id} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                          <div>
                              <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-bold text-lg">{stand.brandName}</h3>
                                  <Badge color={stand.status === 'Pendiente' ? 'blue' : stand.status === 'Aprobada' ? 'red' : 'purple'}>
                                      {stand.status}
                                  </Badge>
                              </div>
                              <p className="text-sm text-gray-600">Tipo: {stand.type}</p>
                              <p className="text-xs text-gray-400 mt-1">ID: {stand.id}</p>
                          </div>
                          <div className="flex items-center gap-4">
                              <div className="text-right hidden md:block">
                                  <p className="text-xs font-bold uppercase text-gray-400">Mensajes</p>
                                  <p className="font-bold">{stand.messages.length}</p>
                              </div>
                              <Button onClick={() => setActiveChatStand(stand)} variant="outline" className="flex items-center gap-2">
                                 <MessageCircle size={18} /> Chat / Estado
                              </Button>
                          </div>
                      </MangaCard>
                  ))}
              </div>
          )}

          {/* COSPLAY TAB */}
          {activeTab === 'cosplay' && (
              <div className="space-y-4 animate-in fade-in">
                  {cosplays.length === 0 && (
                      <MangaCard className="text-center py-10 bg-gray-50">
                          <Trophy size={48} className="mx-auto text-gray-300 mb-4" />
                          <p className="text-gray-500 mb-4">No te has inscripto a ningún concurso.</p>
                          <Link to="/concursos-cosplay">
                              <Button>¡Inscribirse!</Button>
                          </Link>
                      </MangaCard>
                  )}
                  {cosplays.map(cos => (
                      <MangaCard key={cos.id} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                           <div className="flex items-center gap-4">
                              <div className="w-16 h-16 bg-gray-200 border border-black overflow-hidden flex items-center justify-center">
                                  {cos.referenceImage ? (
                                      <img src={cos.referenceImage} className="w-full h-full object-cover" alt="Ref" />
                                  ) : (
                                      <Trophy className="text-gray-400" />
                                  )}
                              </div>
                              <div>
                                  <div className="flex items-center gap-2 mb-1">
                                      <h3 className="font-bold text-lg">{cos.characterName}</h3>
                                      <Badge color={cos.status === 'Inscripto' ? 'yellow' : cos.status === 'Confirmado' ? 'green' : 'red'}>
                                          {cos.status}
                                      </Badge>
                                  </div>
                                  <p className="text-sm text-gray-600">{cos.seriesName} <span className="text-gray-400">•</span> {cos.category}</p>
                              </div>
                           </div>
                           <Button onClick={() => setActiveChatCosplay(cos)} variant="outline" className="flex items-center gap-2">
                               <MessageCircle size={18} /> Chat / Estado
                           </Button>
                      </MangaCard>
                  ))}
              </div>
          )}

          {/* GALLERY TAB */}
          {activeTab === 'gallery' && (
              <div className="animate-in fade-in">
                  {galleryItems.length === 0 && (
                      <MangaCard className="text-center py-10 bg-gray-50">
                          <Camera size={48} className="mx-auto text-gray-300 mb-4" />
                          <p className="text-gray-500 mb-4">No has subido fotos a la galería.</p>
                          <Link to="/galeria">
                              <Button>¡Subir Foto!</Button>
                          </Link>
                      </MangaCard>
                  )}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {galleryItems.map(item => (
                          <MangaCard key={item.id} className="p-2 relative group">
                              <div className="aspect-square bg-gray-100 overflow-hidden border border-black mb-2">
                                  <img src={item.url} alt="User gallery" className="w-full h-full object-cover" />
                              </div>
                              <div className="flex justify-between items-start">
                                  <div className="text-xs truncate max-w-[70%] text-gray-500">{item.description}</div>
                                  <StatusIcon status={item.status} />
                              </div>
                              {item.feedback && (
                                  <div className="mt-2 bg-red-50 p-2 border border-red-200 rounded text-xs text-red-700">
                                      <span className="font-bold flex items-center gap-1"><AlertTriangle size={10}/> Rechazada:</span>
                                      {item.feedback}
                                  </div>
                              )}
                          </MangaCard>
                      ))}
                  </div>
              </div>
          )}

          {/* GIVEAWAYS TAB */}
          {activeTab === 'giveaways' && (
              <div className="space-y-4 animate-in fade-in">
                  {myGiveaways.length === 0 && (
                      <MangaCard className="text-center py-10 bg-gray-50">
                          <Gift size={48} className="mx-auto text-gray-300 mb-4" />
                          <p className="text-gray-500 mb-4">No estás participando en ningún sorteo.</p>
                          <Link to="/sorteos">
                              <Button>¡Ver Sorteos!</Button>
                          </Link>
                      </MangaCard>
                  )}
                  {myGiveaways.map(g => (
                      <MangaCard key={g.id} className="flex flex-col md:flex-row justify-between items-center gap-4">
                           <div className="flex items-center gap-4">
                               <div className="bg-yellow-100 p-3 rounded-full border border-yellow-400">
                                   <Gift className="text-yellow-600" />
                               </div>
                               <div>
                                   <h3 className="font-bold text-lg">{g.title}</h3>
                                   <p className="text-sm text-gray-600">Premio: {g.prize}</p>
                                   <p className="text-xs text-gray-400 mt-1">Sortea: {g.endDate}</p>
                               </div>
                           </div>
                           <div className="text-center md:text-right">
                               {g.status === 'Activo' ? (
                                   <Badge color="green">Participando</Badge>
                               ) : (
                                   <div className="flex flex-col items-center md:items-end">
                                       <Badge color="purple">Finalizado</Badge>
                                       <span className="text-xs mt-1 font-bold">
                                           {g.winner === user.name ? '¡GANASTE! 🎉' : 'No ganaste esta vez'}
                                       </span>
                                   </div>
                               )}
                           </div>
                      </MangaCard>
                  ))}
              </div>
          )}
      </div>

      {/* CHAT MODAL FOR USER (Stands/Cosplay) */}
      {(activeChatStand || activeChatCosplay) && (
          <Modal
            title={activeChatStand ? `Chat Stand: ${activeChatStand.brandName}` : `Chat Cosplay: ${activeChatCosplay?.characterName}`}
            onClose={() => { setActiveChatStand(null); setActiveChatCosplay(null); }}
          >
              <div className="flex flex-col h-[50vh]">
                  {/* WhatsApp Contact Banner */}
                  <div className="bg-green-50 border-2 border-green-200 p-3 mb-3 rounded flex items-center justify-between">
                      <div className="flex-grow">
                          <p className="text-xs font-bold text-green-800 mb-1">Contacto Directo</p>
                          <p className="text-xs text-green-700">¿Preferís hablar por WhatsApp?</p>
                      </div>
                      <a
                          href="https://wa.me/5492975585027"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-full font-bold transition-colors text-xs whitespace-nowrap"
                          title="Contactar por WhatsApp"
                      >
                          <Phone size={14} />
                          WhatsApp
                      </a>
                  </div>

                  {/* Status Banner */}
                  <div className={`p-3 mb-4 rounded border-2 ${
                      (activeChatStand?.status || activeChatCosplay?.status)?.includes('Rechaza') ? 'bg-red-50 border-red-200' :
                      (activeChatStand?.status === 'Aprobada' || activeChatCosplay?.status === 'Confirmado') ? 'bg-green-50 border-green-200' :
                      'bg-blue-50 border-blue-200'
                  }`}>
                      <div className="flex items-center gap-2 font-bold mb-1">
                          <StatusIcon status={activeChatStand?.status || activeChatCosplay?.status || ''} />
                          <span className="uppercase">Estado: {activeChatStand?.status || activeChatCosplay?.status}</span>
                      </div>
                      <p className="text-xs text-gray-600">
                          {(activeChatStand?.status || activeChatCosplay?.status)?.includes('Rechaza')
                              ? 'Tu solicitud fue rechazada. Revisa los mensajes abajo para ver el motivo y responde si deseas corregirlo.'
                              : 'Usa este chat para comunicarte directamente con los organizadores.'}
                      </p>
                  </div>

                  {/* Messages Area */}
                  <div className="flex-grow overflow-y-auto space-y-4 p-2 mb-4" ref={chatScrollRef}>
                      {(activeChatStand ? activeChatStand.messages : activeChatCosplay?.messages || []).length === 0 && (
                          <div className="text-center text-gray-400 italic text-sm mt-10">
                              No hay mensajes aún. Escribí tu consulta aquí.
                          </div>
                      )}
                      
                      {(activeChatStand ? activeChatStand.messages : activeChatCosplay?.messages || []).map(msg => (
                          <div key={msg.id} className={`flex flex-col ${msg.sender === 'USER' ? 'items-end' : 'items-start'}`}>
                              <div className={`max-w-[85%] p-3 border-2 border-black shadow-sm ${
                                  msg.sender === 'USER' 
                                  ? 'bg-white text-black rounded-tr-xl rounded-br-xl rounded-bl-xl' 
                                  : 'bg-black text-white rounded-tl-xl rounded-br-xl rounded-bl-xl' // Admin msgs distinct
                              }`}>
                                  <p className="text-xs font-bold mb-1 opacity-70">{msg.sender === 'USER' ? 'Tú' : 'Organización Torami'}</p>
                                  {msg.imageUrl && (
                                    <div className="mb-2 cursor-pointer group relative" onClick={() => setViewImage(msg.imageUrl)}>
                                        <img src={msg.imageUrl} alt="attachment" className="rounded border border-gray-500 max-h-40 object-cover transition-opacity group-hover:opacity-80" />
                                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded flex items-center justify-center">
                                            <span className="text-white text-xs opacity-0 group-hover:opacity-100 bg-black bg-opacity-70 px-2 py-1 rounded">
                                                Click para ver completa
                                            </span>
                                        </div>
                                    </div>
                                  )}
                                  <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                              </div>
                              <span className="text-[10px] text-gray-400 mt-1">{msg.timestamp}</span>
                          </div>
                      ))}
                  </div>

                  {/* Input Area */}
                  <form onSubmit={handleSendMessage} className="flex gap-2 border-t pt-4">
                      <input 
                        type="text" 
                        className="flex-grow border-2 border-black p-2 focus:outline-none h-10" 
                        placeholder="Escribir mensaje..." 
                        value={chatMessage} 
                        onChange={(e) => setChatMessage(e.target.value)} 
                      />
                      <Button type="submit" className="p-2 bg-black text-white hover:bg-gray-800 h-10 w-10 flex items-center justify-center">
                          <Send size={18} />
                      </Button>
                  </form>
              </div>
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
