import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../App';
import { SectionTitle, MangaCard, Badge, Button, Input } from '../components/UI';
import { getUserStands, getUserCosplays, addStandMessage, addCosplayMessage, getUserGallery, getUserGiveaways, updateUserProfile, validateStamp } from '../services/data';
import { StandApplication, CosplayRegistration, GalleryItem, Giveaway } from '../types';
import { Store, Trophy, MessageCircle, X, Send, Clock, CheckCircle, XCircle, Image, Gift, User as UserIcon, AlertTriangle, Save, Camera, Ticket, QrCode, Sparkles, MapPin, ScanLine, Crown } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState<'stands'|'cosplay'|'gallery'|'giveaways'|'profile'|'ticket'|'passport'>('ticket');
  
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
  const [profileData, setProfileData] = useState({ name: '', email: '' });
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // Chat State
  const [activeChatStand, setActiveChatStand] = useState<StandApplication | null>(null);
  const [activeChatCosplay, setActiveChatCosplay] = useState<CosplayRegistration | null>(null);
  const [chatMessage, setChatMessage] = useState('');
  const chatScrollRef = useRef<HTMLDivElement>(null);

  const refreshData = () => {
      if (user) {
          getUserStands(user.id).then(data => {
              setStands(data);
              if (activeChatStand) {
                  const updated = data.find(s => s.id === activeChatStand.id);
                  if (updated) setActiveChatStand(updated);
              }
          });
          getUserCosplays(user.id).then(data => {
              setCosplays(data);
              if (activeChatCosplay) {
                  const updated = data.find(c => c.id === activeChatCosplay.id);
                  if (updated) setActiveChatCosplay(updated);
              }
          });
          getUserGallery(user.id).then(setGalleryItems);
          getUserGiveaways(user.id).then(setMyGiveaways);
          setProfileData({ name: user.name, email: user.email });
          
          const currentStamps = user.stamps || [];
          setStamps(currentStamps);
      }
  };

  useEffect(() => {
    refreshData();
  }, [user]);

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
      refreshData();
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
      e.preventDefault();
      if (user) {
          await updateUserProfile({ ...user, name: profileData.name, email: profileData.email });
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

  const TabButton = ({ id, label, icon: Icon }: any) => (
      <button 
         onClick={() => setActiveTab(id)}
         className={`flex-1 min-w-[80px] py-3 font-bold uppercase flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 border-b-4 transition-colors text-[10px] md:text-sm ${activeTab === id ? 'border-torami-red bg-gray-50 text-torami-red' : 'border-transparent text-gray-500 hover:text-black hover:bg-gray-50'}`}
      >
          <Icon size={18} /> <span>{label}</span>
      </button>
  );

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
            <TabButton id="ticket" label="Entrada" icon={Ticket} />
            <TabButton id="passport" label="Pasaporte" icon={ScanLine} />
            <TabButton id="profile" label="Perfil" icon={UserIcon} />
            <TabButton id="stands" label="Stands" icon={Store} />
            <TabButton id="cosplay" label="Cosplay" icon={Trophy} />
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
                                        <span>{user.email}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="font-bold">ID:</span>
                                        <span className="font-mono">{user.id}</span>
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
                                    <div className="mb-2">
                                        <img src={msg.imageUrl} alt="attachment" className="rounded border border-gray-500 max-h-40 object-cover" />
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
    </div>
  );
};
