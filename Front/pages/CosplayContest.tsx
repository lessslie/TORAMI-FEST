import React, { useState, useEffect } from 'react';
import { SectionTitle, MangaCard, Input, Button, Badge } from '../components/UI';
import { addCosplayRegistration, getUpcomingEvents } from '../services/data';
import { Sparkles, Trophy, Mic2, Users, Upload, Image, CheckCircle, Send, AlertCircle, Calendar } from 'lucide-react';
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

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const upcomingEvents = await getUpcomingEvents();
        setEvents(upcomingEvents);
        if (upcomingEvents.length > 0) {
          setFormData(prev => ({ ...prev, eventId: upcomingEvents[0].id }));
        }
      } catch (error) {
        console.error('Error loading events:', error);
      }
    };
    loadEvents();
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
    } catch (err: any) {
      if (err.response?.status === 401) {
        setError('Debes iniciar sesión para inscribirte al concurso');
      } else {
        setError(err.message || 'Error al enviar la inscripción. Por favor intentá de nuevo.');
      }
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

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
        <SectionTitle>
           <span className="flex items-center gap-3">
             <Trophy className="text-yellow-500 fill-current transform rotate-12" /> Concurso de Cosplay
           </span>
        </SectionTitle>

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

            <Button type="submit" disabled={isSubmitting} className="w-full flex items-center justify-center gap-2 py-4 text-lg">
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Enviando inscripción...
                  </>
                ) : (
                  <>
                    <Send size={20} /> Inscribirse al Concurso
                  </>
                )}
            </Button>
        </form>
    </div>
  );
};
