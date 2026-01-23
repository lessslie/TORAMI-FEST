import React, { useState, useEffect } from 'react';
import { SectionTitle, MangaCard, Input, Button } from '../components/UI';
import { addCosplayGuestRegistration, getUpcomingEvents, getCosplayGuestAvailableSlots, getConfig, getUserCosplayGuests, uploadImageToCloudinary } from '../services/data';
import { Sparkles, Trophy, Mic2, Users, Upload, Image, CheckCircle, Send, AlertCircle, Calendar, Mail, X, Star } from 'lucide-react';
import { useAuth } from '../App';
import { useNavigate } from 'react-router-dom';
import { Event, AppConfig, CosplayGuest as CosplayGuestType } from '../types';

export const CosplayGuest = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Estado de configuración (inscripciones abiertas/cerradas)
  const [inscripcionesAbiertas, setInscripcionesAbiertas] = useState<boolean | null>(null);

  const [events, setEvents] = useState<Event[]>([]);
  const [formData, setFormData] = useState({
    participantName: '',
    nickname: '',
    whatsapp: '',
    instagram: '',
    website: '',
    characterName: '',
    seriesName: '',
    referenceImage: '',
    eventId: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [whatsappError, setWhatsappError] = useState<string | null>(null);

  // Cosplay Guest Slots State
  const [availableSlots, setAvailableSlots] = useState<number | null>(null);
  const [totalSlots, setTotalSlots] = useState<number>(30);
  const [assignedNumber, setAssignedNumber] = useState<number | null>(null);

  // User's existing registrations
  const [myRegistrations, setMyRegistrations] = useState<CosplayGuestType[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load config para saber si inscripciones están abiertas
        const configData = await getConfig();
        setInscripcionesAbiertas(configData.cosplayGuestInscripcionesAbiertas !== false);

        // Load events
        const upcomingEvents = await getUpcomingEvents();
        setEvents(upcomingEvents);
        if (upcomingEvents.length > 0) {
          setFormData(prev => ({ ...prev, eventId: upcomingEvents[0].id }));
        }

        // Load available slots
        const slotsData = await getCosplayGuestAvailableSlots();
        setAvailableSlots(slotsData.available);
        setTotalSlots(slotsData.limit);

        // Load user's existing registrations
        if (user) {
          const userCosplayGuests = await getUserCosplayGuests();
          setMyRegistrations(userCosplayGuests || []);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };
    loadData();
  }, [user]);

  // Validar que el WhatsApp solo contenga números y caracteres permitidos
  const validateWhatsapp = (value: string): boolean => {
    const whatsappRegex = /^[\d\s\-+()]*$/;
    return whatsappRegex.test(value);
  };

  const handleChange = (e: any) => {
    const { name, value } = e.target;

    // Validación especial para WhatsApp
    if (name === 'whatsapp') {
      if (!validateWhatsapp(value)) {
        setWhatsappError('Solo se permiten números, espacios, guiones y +');
        return; // No actualizar el valor si contiene caracteres inválidos
      } else {
        setWhatsappError(null);
      }
    }

    setFormData({ ...formData, [name]: value });
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.type.startsWith('image/')) {
        setError("Solo se permiten archivos de imagen.");
        return;
      }
      setIsCompressing(true);
      setError(null);
      try {
        // Subir a Cloudinary y obtener URL
        const imageUrl = await uploadImageToCloudinary(file);
        setFilePreview(imageUrl);
        setFormData({ ...formData, referenceImage: imageUrl });
      } catch (err: any) {
        setError(err.message || "Error al subir la imagen. Intentá con otra.");
        console.error('Error uploading image:', err);
      } finally {
        setIsCompressing(false);
      }
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
      const result = await addCosplayGuestRegistration({
        participantName: formData.participantName,
        nickname: formData.nickname,
        whatsapp: formData.whatsapp,
        instagram: formData.instagram,
        website: formData.website,
        characterName: formData.characterName,
        seriesName: formData.seriesName,
        referenceImage: formData.referenceImage,
        category: 'General',
        eventId: formData.eventId
      });
      setAssignedNumber(result.assignedNumber);
      setSubmitted(true);
      // Refresh slots
      const slotsData = await getCosplayGuestAvailableSlots();
      setAvailableSlots(slotsData.available);
    } catch (err: any) {
      if (err.response?.status === 401) {
        setError('Debes iniciar sesión para inscribirte como Cosplay Invitado');
      } else if (err.message && err.message.includes('cupos')) {
        setError('No hay cupos disponibles (30/30 ocupados).');
      } else {
        setError(err.message || 'Error al enviar la inscripción. Por favor intentá de nuevo.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };


  if (submitted && assignedNumber) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <MangaCard className="py-12 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-800 flex flex-col items-center">
          <Star className="text-yellow-500 w-20 h-20 mb-4 animate-bounce fill-current" />
          <h2 className="font-display text-3xl mb-4">¡Inscripción Confirmada!</h2>
          <div className="bg-white border-4 border-purple-600 p-6 mb-6 shadow-manga">
            <p className="text-sm text-gray-600 mb-2">Tu número asignado para la fila es:</p>
            <div className="text-6xl font-display text-purple-600">#{assignedNumber}</div>
          </div>
          <p className="mb-6 font-bold">¡Ya estas anotado en la fila para cosplay invitado ! Si no podés asistir, avisá para liberar tu lugar a otra persona.</p>
          <Button onClick={() => navigate('/dashboard')}>Ver Mi Panel</Button>
        </MangaCard>
      </div>
    );
  }

  const noSlotsAvailable = availableSlots === 0;
  const isAlreadyRegistered = myRegistrations.some(r => r.eventId === formData.eventId);

  // Pantalla de inscripciones cerradas (lee de la config de DB)
  if (inscripcionesAbiertas === false) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <SectionTitle>
          <span className="flex items-center gap-3">
            <Star className="text-yellow-500 fill-current animate-pulse" /> Cosplay Invitados
          </span>
        </SectionTitle>
        <MangaCard className="bg-gray-100 border-gray-400 text-center py-16">
          <div className="text-6xl mb-4">🚫</div>
          <h2 className="text-2xl font-bold text-gray-700 mb-4">Inscripciones Cerradas</h2>
          <p className="text-gray-600 max-w-md mx-auto">
            El cupo está completo. La página se volverá a habilitar cuando se libere un cupo.
          </p>
          <p className="text-sm text-gray-500 mt-4">
            Seguinos en nuestras redes para enterarte de las novedades.
          </p>
        </MangaCard>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
        <SectionTitle>
           <span className="flex items-center gap-3">
             <Star className="text-yellow-500 fill-current animate-pulse" /> Cosplay Invitados
           </span>
        </SectionTitle>

        <MangaCard className="mb-6 bg-purple-50 border-purple-600">
          <p className="font-bold text-lg mb-2">🌟 Inscripción Especial para Cosplayers Invitados</p>
          <p className="text-sm text-gray-700">
            Esta inscripción es solo para artistas invitados de Torami. Si vas a concursar, anotate en
            la inscripción de Cosplay Concurso.
          </p>
          <p className="text-sm text-gray-700">
            Registrate como cosplay invitado y obtené tu número oficial (del 1 al 30). ¡Participá en el
            desfile o performance con reconocimiento especial!
          </p>
        </MangaCard>

        {/* Slot Counter Banner */}
        {availableSlots !== null && (
          <MangaCard className={`mb-6 ${noSlotsAvailable ? 'bg-red-50 border-red-600' : availableSlots <= 5 ? 'bg-yellow-50 border-yellow-600' : 'bg-green-50 border-green-600'}`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg">
                  {noSlotsAvailable ? '🚫 Cupos Agotados!' : `⚠️ Quedan ${availableSlots} cupos disponibles`}
                </h3>
                <p className="text-sm text-gray-700">
                  {noSlotsAvailable
                    ? `Los ${totalSlots} cupos están ocupados.`
                    : `Total: ${availableSlots}/${totalSlots} cupos libres`
                  }
                </p>
              </div>
            </div>
          </MangaCard>
        )}

        <div className="grid md:grid-cols-3 gap-4 mb-8">
            {/* <MangaCard className="bg-blue-50 text-center">
                <Mic2 className="mx-auto mb-2 text-blue-600" />
                <h4 className="font-bold uppercase">Performance</h4>
                <p className="text-xs text-gray-600">Actuación, lipsync y manejo de escenario.</p>
            </MangaCard> */}
            {/* <MangaCard className="bg-gray-200 text-center opacity-60 relative">
                <div className="absolute top-2 right-2 bg-gray-500 text-white text-xs font-bold px-2 py-1 border border-black">
                    Próximamente
                </div>
                <Sparkles className="mx-auto mb-2 text-gray-400" />
                <h4 className="font-bold uppercase text-gray-500">Chibi</h4>
                <p className="text-xs text-gray-500">Categoría especial para menores de 12 años.</p>
            </MangaCard>
            <MangaCard className="bg-gray-200 text-center opacity-60 relative">
                <div className="absolute top-2 right-2 bg-gray-500 text-white text-xs font-bold px-2 py-1 border border-black">
                    Próximamente
                </div>
                <Users className="mx-auto mb-2 text-gray-400" />
                <h4 className="font-bold uppercase text-gray-500">Grupal</h4>
                <p className="text-xs text-gray-500">Para teams de 2 o más integrantes.</p>
            </MangaCard> */}
        </div>

        {/* <MangaCard className="mb-8 border-l-8 border-l-purple-600">
             <h3 className="font-bold text-lg mb-2">Reglas Importantes</h3>
             <ul className="list-disc list-inside space-y-1 text-sm text-gray-800">
                <li>Duración máxima de performance: 3 minutos.</li>
                <li>Prohibido el uso de fuego real, líquidos o pirotecnia.</li>
                <li>Las armas deben ser de utilería (goma eva, cartón, impresión 3D).</li>
             </ul>
        </MangaCard> */}

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

            {/* Aviso si ya está inscrito */}
            {isAlreadyRegistered && (
              <div className="p-4 bg-yellow-50 border-2 border-yellow-300 rounded">
                <p className="text-yellow-700 font-medium">
                  ⚠️ Ya estás inscrito como cosplay invitado para este evento.
                </p>
              </div>
            )}

            <h3 className="font-display text-xl border-b-2 border-black pb-2 mb-4">Datos del Cosplayer</h3>

            <div className="grid md:grid-cols-2 gap-6">
                <Input name="participantName" label="Nombre Real" required onChange={handleChange} />
                <Input name="nickname" label="Nombre Artístico / Nick" onChange={handleChange} />
            </div>
            
            <div>
              <Input
                  name="whatsapp"
                  label="Número de WhatsApp (Obligatorio)"
                  required
                  onChange={handleChange}
                  value={formData.whatsapp}
                  placeholder="Ej: 11 1234-5678"
              />
              {whatsappError && (
                <p className="text-red-500 text-xs mt-1">{whatsappError}</p>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                <Input
                    name="instagram"
                    label="Instagram (Opcional)"
                    onChange={handleChange}
                    placeholder="@tuusuario"
                />
                <Input
                    name="website"
                    label="Sitio Web / Red Social (Opcional)"
                    onChange={handleChange}
                    placeholder="https://..."
                />
            </div>

            <h3 className="font-display text-xl border-b-2 border-black pb-2 mb-4 mt-8">Datos del Personaje</h3>

            <div className="grid md:grid-cols-2 gap-6">
                <Input name="characterName" label="Nombre del Personaje" required onChange={handleChange} />
                <Input name="seriesName" label="Serie / Anime / Juego" required onChange={handleChange} />
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
              disabled={isSubmitting || noSlotsAvailable || isAlreadyRegistered}
              className="w-full flex items-center justify-center gap-2 py-4 text-lg"
            >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Enviando inscripción...
                  </>
                ) : isAlreadyRegistered ? (
                  <>
                    ⚠️ Ya estás inscrito en este evento
                  </>
                ) : noSlotsAvailable ? (
                  <>
                    🚫 Cupos Agotados (30/30)
                  </>
                ) : (
                  <>
                    <Star size={20} className="fill-current" /> Inscribirse como Cosplay Invitado
                  </>
                )}
            </Button>
        </form>
    </div>
  );
};
