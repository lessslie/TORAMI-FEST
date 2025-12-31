import React, { useState, useEffect } from 'react';
import { SectionTitle, MangaCard, Input, Button, Badge } from '../components/UI';
import { addCosplayRegistration, getUpcomingEvents, getCosplayAvailableSlots, addToWaitingList } from '../services/data';
import { Sparkles, Trophy, Mic2, Users, Upload, Image, CheckCircle, Send, AlertCircle, Calendar, Mail, X } from 'lucide-react';
import { useAuth } from '../App';
import { useNavigate } from 'react-router-dom';
import { Event } from '../types';

export const CosplayContest = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [formData, setFormData] = useState({
    participantName: '',
    nickname: '',
    whatsapp: '',
    characterName: '',
    seriesName: '',
    category: 'General',
    audioLink: '',
    referenceImage: '',
    eventId: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Cosplay Slots State
  const [availableSlots, setAvailableSlots] = useState<number | null>(null);
  const [totalSlots, setTotalSlots] = useState<number>(20);
  const [showWaitingListModal, setShowWaitingListModal] = useState(false);
  const [waitingListEmail, setWaitingListEmail] = useState('');
  const [notifyBySocial, setNotifyBySocial] = useState(true);
  const [waitingListSubmitted, setWaitingListSubmitted] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load events
        const upcomingEvents = await getUpcomingEvents();
        setEvents(upcomingEvents);
        if (upcomingEvents.length > 0) {
          setFormData(prev => ({ ...prev, eventId: upcomingEvents[0].id }));
        }

        // Load available slots
        const slotsData = await getCosplayAvailableSlots();
        setAvailableSlots(slotsData.available);
        setTotalSlots(slotsData.limit);
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };
    loadData();
  }, []);

  const handleChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          const reader = new FileReader();
          reader.onloadend = () => {
              setFilePreview(reader.result as string);
              setFormData({ ...formData, referenceImage: reader.result as string });
          };
          reader.readAsDataURL(file);
      }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Verificar si el usuario está logueado
    if (!user) {
      setError('Debes iniciar sesión para inscribirte al concurso');
      return;
    }

    if (!formData.eventId) {
      setError('Debes seleccionar un evento para tu inscripción');
      return;
    }

    setIsSubmitting(true);
    try {
      // Only send fields that the DTO accepts
      await addCosplayRegistration({
        participantName: formData.participantName,
        nickname: formData.nickname,
        whatsapp: formData.whatsapp,
        characterName: formData.characterName,
        seriesName: formData.seriesName,
        category: formData.category,
        referenceImage: formData.referenceImage,
        audioLink: formData.audioLink,
        eventId: formData.eventId
      });
      setSubmitted(true);
      // Refresh slots
      const slotsData = await getCosplayAvailableSlots();
      setAvailableSlots(slotsData.available);
    } catch (err: any) {
      if (err.response?.status === 401) {
        setError('Debes iniciar sesión para inscribirte al concurso');
      } else if (err.message && err.message.includes('cupos')) {
        setError('No hay cupos disponibles. Podés anotarte en la lista de espera.');
      } else {
        setError(err.message || 'Error al enviar la inscripción. Por favor intentá de nuevo.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWaitingListSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError('Debes iniciar sesión para anotarte en la lista de espera');
      return;
    }

    setIsSubmitting(true);
    try {
      await addToWaitingList({
        participantName: formData.participantName || user.name,
        nickname: formData.nickname,
        whatsapp: formData.whatsapp,
        characterName: formData.characterName || 'Pendiente',
        seriesName: formData.seriesName || 'Pendiente',
        category: formData.category,
        referenceImage: formData.referenceImage,
        audioLink: formData.audioLink,
        eventId: formData.eventId || events[0]?.id,
        notifyEmail: waitingListEmail || user.email,
      });
      setWaitingListSubmitted(true);
      setShowWaitingListModal(false);
    } catch (err: any) {
      setError(err.message || 'Error al anotarte en la lista de espera');
      setShowWaitingListModal(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <MangaCard className="py-12 bg-purple-50 border-purple-800 flex flex-col items-center">
          <Trophy className="text-purple-600 w-20 h-20 mb-4 animate-bounce" />
          <h2 className="font-display text-3xl mb-4">¡Inscripción Confirmada!</h2>
          <p className="mb-6">¡Mucha suerte! Recordá traer tu audio en pendrive por las dudas.</p>
          <Button onClick={() => setSubmitted(false)}>Inscribir a otro</Button>
        </MangaCard>
      </div>
    );
  }

  if (waitingListSubmitted) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <MangaCard className="py-12 bg-blue-50 border-blue-800 flex flex-col items-center">
          <Mail className="text-blue-600 w-20 h-20 mb-4" />
          <h2 className="font-display text-3xl mb-4">¡Te anotaste en la Lista de Espera!</h2>
          <p className="mb-4">Te avisaremos por email si se libera un cupo.</p>
          <p className="text-sm text-gray-600 mb-6">También seguí nuestras redes sociales para estar al tanto de las novedades.</p>
          <Button onClick={() => navigate('/')}>Volver al Inicio</Button>
        </MangaCard>
      </div>
    );
  }

  const noSlotsAvailable = availableSlots === 0;

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
        <SectionTitle>
           <span className="flex items-center gap-3">
             <Trophy className="text-yellow-500 fill-current transform rotate-12" /> Concurso de Cosplay
           </span>
        </SectionTitle>

        {/* Slot Counter Banner */}
        {availableSlots !== null && (
          <MangaCard className={`mb-6 ${noSlotsAvailable ? 'bg-red-50 border-red-600' : availableSlots <= 5 ? 'bg-yellow-50 border-yellow-600' : 'bg-green-50 border-green-600'}`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg">
                  {noSlotsAvailable ? '🚫 Cupos Agotados' : `⚠️ Quedan ${availableSlots} cupos disponibles`}
                </h3>
                <p className="text-sm text-gray-700">
                  {noSlotsAvailable
                    ? `Los ${totalSlots} cupos están ocupados. Podés anotarte en la lista de espera.`
                    : `Total: ${availableSlots}/${totalSlots} cupos libres`
                  }
                </p>
              </div>
              {noSlotsAvailable && (
                <Button
                  onClick={() => setShowWaitingListModal(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Mail size={18} className="mr-2 inline" /> Lista de Espera
                </Button>
              )}
            </div>
          </MangaCard>
        )}

        <div className="grid md:grid-cols-3 gap-4 mb-8">
            <MangaCard className="bg-blue-50 text-center">
                <Mic2 className="mx-auto mb-2 text-blue-600" />
                <h4 className="font-bold uppercase">Performance</h4>
                <p className="text-xs text-gray-600">Actuación, lipsync y manejo de escenario.</p>
            </MangaCard>
            <MangaCard className="bg-pink-50 text-center">
                <Sparkles className="mx-auto mb-2 text-pink-600" />
                <h4 className="font-bold uppercase">Chibi</h4>
                <p className="text-xs text-gray-600">Categoría especial para menores de 12 años.</p>
            </MangaCard>
            <MangaCard className="bg-yellow-50 text-center">
                <Users className="mx-auto mb-2 text-yellow-600" />
                <h4 className="font-bold uppercase">Grupal</h4>
                <p className="text-xs text-gray-600">Para teams de 2 o más integrantes.</p>
            </MangaCard>
        </div>

        <MangaCard className="mb-8 border-l-8 border-l-purple-600">
             <h3 className="font-bold text-lg mb-2">Reglas Importantes</h3>
             <ul className="list-disc list-inside space-y-1 text-sm text-gray-800">
                <li>Duración máxima de performance: 3 minutos.</li>
                <li>Prohibido el uso de fuego real, líquidos o pirotecnia.</li>
                <li>Las armas deben ser de utilería (goma eva, cartón, impresión 3D).</li>
                <li>Traer audio en MP3 en un Pendrive el día del evento.</li>
             </ul>
        </MangaCard>

        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Event Selector */}
            <div>
              <label className="block text-sm font-bold mb-2 uppercase flex items-center gap-2">
                <Calendar size={16} className="text-purple-600" /> Evento al que te querés inscribir *
              </label>
              {events.length === 0 ? (
                <div className="border-2 border-gray-300 p-4 bg-gray-50 text-gray-500 text-center">
                  No hay eventos próximos disponibles
                </div>
              ) : (
                <select
                  name="eventId"
                  className="w-full border-2 border-black p-3 bg-white focus:outline-none focus:shadow-manga"
                  onChange={handleChange}
                  value={formData.eventId}
                  required
                >
                  <option value="">-- Seleccioná un evento --</option>
                  {events.map(event => (
                    <option key={event.id} value={event.id}>
                      {event.title} - {new Date(event.date).toLocaleDateString('es-AR')} ({event.location})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <h3 className="font-display text-xl border-b-2 border-black pb-2 mb-4">Datos del Cosplayer</h3>

            <div className="grid md:grid-cols-2 gap-6">
                <Input name="participantName" label="Nombre Real" required onChange={handleChange} />
                <Input name="nickname" label="Nombre Artístico / Nick" onChange={handleChange} />
            </div>
            
            <Input 
                name="whatsapp" 
                label="Número de WhatsApp (Obligatorio)" 
                required 
                onChange={handleChange} 
                placeholder="Para avisos del concurso" 
            />

            <h3 className="font-display text-xl border-b-2 border-black pb-2 mb-4 mt-8">Datos del Personaje</h3>

            <div className="grid md:grid-cols-2 gap-6">
                <Input name="characterName" label="Nombre del Personaje" required onChange={handleChange} />
                <Input name="seriesName" label="Serie / Anime / Juego" required onChange={handleChange} />
            </div>

            <div>
             <label className="block text-sm font-bold mb-1 uppercase">Categoría</label>
             <select 
                name="category" 
                className="w-full border-2 border-black p-3 bg-white focus:outline-none focus:shadow-manga"
                onChange={handleChange}
                value={formData.category}
             >
                <option value="General">General (Desfile)</option>
                <option value="Performance">Performance (Actuación)</option>
                <option value="Chibi">Chibi (Niños)</option>
                <option value="Grupal">Grupal</option>
             </select>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                <div>
                   <label className="block text-sm font-bold mb-1 uppercase">Imagen de Referencia</label>
                   <div className="border-2 border-dashed border-gray-400 p-4 text-center cursor-pointer hover:bg-gray-50 relative h-32 flex flex-col items-center justify-center">
                       <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={handleFile} />
                       {filePreview ? (
                           <img src={filePreview} alt="Ref" className="h-full object-contain" />
                       ) : (
                           <>
                             <Image className="text-gray-400 mb-1" />
                             <span className="text-xs font-bold text-gray-500">Subir Foto</span>
                           </>
                       )}
                   </div>
                </div>
                <div>
                    <Input name="audioLink" label="Link de Audio/Video (Drive/YouTube)" placeholder="Opcional si es solo desfile" onChange={handleChange} />
                    <p className="text-xs text-gray-500 mt-1">Si vas a hacer performance, dejanos el link del audio o video de fondo.</p>
                </div>
            </div>

            {error && (
              <MangaCard className="bg-red-50 border-red-500 border-l-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="text-red-600 flex-shrink-0 mt-1" size={24} />
                  <div>
                    <h4 className="font-bold text-red-800 mb-2">No podés inscribirte</h4>
                    <p className="text-red-700">{error}</p>
                    <Button
                      onClick={() => navigate('/login')}
                      className="mt-3 bg-red-600 hover:bg-red-700"
                    >
                      Iniciar Sesión
                    </Button>
                  </div>
                </div>
              </MangaCard>
            )}

            <Button
              type="submit"
              disabled={isSubmitting || noSlotsAvailable}
              className="w-full flex items-center justify-center gap-2 py-4 text-lg"
            >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Enviando inscripción...
                  </>
                ) : noSlotsAvailable ? (
                  <>
                    🚫 Cupos Agotados
                  </>
                ) : (
                  <>
                    <Send size={20} /> Inscribirse al Concurso
                  </>
                )}
            </Button>

            {noSlotsAvailable && (
              <Button
                onClick={() => setShowWaitingListModal(true)}
                className="w-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center gap-2 py-4 text-lg"
              >
                <Mail size={20} /> Anotarme en Lista de Espera
              </Button>
            )}
        </form>

        {/* Waiting List Modal */}
        {showWaitingListModal && (
          <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white border-2 border-black shadow-manga w-full max-w-md">
              <div className="flex justify-between items-center bg-black text-white p-4">
                <h3 className="font-display text-xl">📧 Lista de Espera</h3>
                <button onClick={() => setShowWaitingListModal(false)}>
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleWaitingListSubmit} className="p-6 space-y-4">
                <p className="text-gray-700">
                  Los cupos están completos ({totalSlots}/{totalSlots} ocupados).
                </p>
                <p className="text-gray-700 font-bold">
                  ¿Querés que te avisemos si se libera un cupo?
                </p>

                <div>
                  <label className="block text-sm font-bold mb-1 uppercase">Email para notificaciones</label>
                  <Input
                    type="email"
                    value={waitingListEmail}
                    onChange={(e) => setWaitingListEmail(e.target.value)}
                    placeholder={user?.email || 'tu@email.com'}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {user?.email ? `Por defecto: ${user.email}` : 'Necesitamos tu email para avisarte'}
                  </p>
                </div>

                <div className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    id="notifyBySocial"
                    checked={notifyBySocial}
                    onChange={(e) => setNotifyBySocial(e.target.checked)}
                    className="mt-1"
                  />
                  <label htmlFor="notifyBySocial" className="text-sm text-gray-700">
                    Avisarme por las redes sociales (estate atenta/o)
                  </label>
                </div>

                <Button type="submit" disabled={isSubmitting} className="w-full">
                  {isSubmitting ? 'Enviando...' : 'Anotarme en Lista de Espera'}
                </Button>
              </form>
            </div>
          </div>
        )}
    </div>
  );
};
