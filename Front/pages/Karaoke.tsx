import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { SectionTitle, MangaCard, Button, Input } from '../components/UI';
import { useAuth } from '../App';
import { Event, Karaoke as KaraokeType } from '../types';
import { getEvents, addKaraokeRegistration, getKaraokeAvailableSlots, getUserKaraoke, getConfig } from '../services/data';
import { Mic, Music, Instagram, Mail, Phone, User, CheckCircle, Clock, XCircle, AlertTriangle, LogIn, Ban } from 'lucide-react';

export const Karaoke = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string>('');
  const [slots, setSlots] = useState<{ available: number; limit: number; occupied: number } | null>(null);
  const [myRegistrations, setMyRegistrations] = useState<KaraokeType[]>([]);
  const [inscripcionesAbiertas, setInscripcionesAbiertas] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [whatsappError, setWhatsappError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    fullName: '',
    instagram: '',
    email: '',
    whatsapp: '',
    songName: '',
    songName2: '',
    songName3: '',
  });

  useEffect(() => {
    loadData();
  }, [user]);

  useEffect(() => {
    if (selectedEvent) {
      getKaraokeAvailableSlots(selectedEvent).then(setSlots);
    }
  }, [selectedEvent]);

  const loadData = async () => {
    try {
      // Cargar config para ver si inscripciones están abiertas
      const configData = await getConfig();
      setInscripcionesAbiertas(configData.karaokeInscripcionesAbiertas !== false);

      const eventsData = await getEvents();
      // Solo eventos futuros
      const futureEvents = eventsData.filter((e: Event) => !e.isPast);
      setEvents(futureEvents);

      if (futureEvents.length > 0) {
        setSelectedEvent(futureEvents[0].id);
      }

      if (user) {
        const registrations = await getUserKaraoke();
        setMyRegistrations(registrations);

        // Prellenar datos del usuario
        setFormData(prev => ({
          ...prev,
          fullName: user.name || '',
          email: user.email || '',
          whatsapp: user.whatsapp || '',
        }));
      }
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Validar que el WhatsApp solo contenga números y caracteres permitidos
  const validateWhatsapp = (value: string): boolean => {
    const whatsappRegex = /^[\d\s\-+()]*$/;
    return whatsappRegex.test(value);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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

    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent) return;

    setSubmitting(true);
    setError(null);

    try {
      await addKaraokeRegistration({
        ...formData,
        eventId: selectedEvent,
      });
      setSuccess(true);
      loadData();
      // Reset form except user data
      setFormData(prev => ({
        ...prev,
        songName: '',
        songName2: '',
        songName3: '',
      }));
    } catch (err: any) {
      setError(err.message || 'Error al inscribirse');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Aprobado':
      case 'APROBADO':
        return <span className="flex items-center gap-1 text-green-600 text-sm"><CheckCircle size={14} /> Aprobado</span>;
      case 'Rechazado':
      case 'RECHAZADO':
        return <span className="flex items-center gap-1 text-red-600 text-sm"><XCircle size={14} /> Rechazado</span>;
      default:
        return <span className="flex items-center gap-1 text-yellow-600 text-sm"><Clock size={14} /> Pendiente</span>;
    }
  };

  // Verificar si ya está inscrito en el evento seleccionado
  const isAlreadyRegistered = myRegistrations.some(r => r.eventId === selectedEvent);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <SectionTitle>Karaoke</SectionTitle>
        <MangaCard className="p-8 text-center">
          <p className="text-gray-500">Cargando...</p>
        </MangaCard>
      </div>
    );
  }

  // Inscripciones cerradas
  if (inscripcionesAbiertas === false) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <SectionTitle>Karaoke</SectionTitle>
        <MangaCard className="p-12 text-center bg-gradient-to-br from-gray-100 to-gray-200">
          <Ban size={80} className="mx-auto text-gray-400 mb-6" />
          <h2 className="text-3xl font-bold text-gray-700 mb-4">Inscripciones Cerradas</h2>
          <p className="text-gray-600 text-lg mb-2">
            Las inscripciones para el karaoke están cerradas en este momento.
          </p>
          <p className="text-gray-500">
            Seguinos en redes para enterarte cuando vuelvan a abrir.
          </p>
        </MangaCard>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
      <SectionTitle>Karaoke</SectionTitle>

      {/* Hero Section */}
      <MangaCard className="p-6 md:p-8 mb-8 bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="text-6xl">🎤</div>
          <div className="text-center md:text-left">
            <h2 className="text-2xl font-bold mb-2">Karaoke en Torami Fest</h2>
            <p className="text-gray-600">
              Subite al escenario y cantá! , Karaoke libre, podés cantar lo que sea (anime, videojuegos, J-Pop o cualquier género).
              {slots && ` Solo ${slots.limit} cupos por evento.`}
            </p>
          </div>
        </div>
      </MangaCard>

      {events.length === 0 ? (
        <MangaCard className="p-8 text-center">
          <AlertTriangle size={48} className="mx-auto text-yellow-500 mb-4" />
          <p className="text-gray-600">No hay eventos próximos disponibles para inscribirse al karaoke.</p>
        </MangaCard>
      ) : !user ? (
        <MangaCard className="p-8 text-center">
          <LogIn size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-bold mb-2">Iniciá sesión para inscribirte</h3>
          <p className="text-gray-600 mb-4">Necesitás una cuenta para participar en el karaoke.</p>
          <Link to="/login">
            <Button>Iniciar Sesión</Button>
          </Link>
        </MangaCard>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulario de inscripción */}
          <div className="lg:col-span-2">
            <MangaCard className="p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Mic size={24} className="text-torami-red" />
                Inscripción
              </h3>

              {success ? (
                <div className="text-center py-8">
                  <CheckCircle size={64} className="mx-auto text-green-500 mb-4" />
                  <h4 className="text-xl font-bold text-green-600 mb-2">¡Inscripción enviada!</h4>
                  <p className="text-gray-600 mb-4">
                    Tu solicitud fue recibida. Te notificaremos cuando sea aprobada.
                  </p>
                  <Button onClick={() => setSuccess(false)}>Inscribirse a otro evento</Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Selector de evento */}
                  <div className="mb-4">
                    <label className="block text-sm font-bold mb-1 uppercase">Evento</label>
                    <select
                      value={selectedEvent}
                      onChange={(e) => setSelectedEvent(e.target.value)}
                      className="w-full border-2 border-black p-3 bg-white focus:outline-none focus:shadow-manga"
                    >
                      {events.map(event => (
                        <option key={event.id} value={event.id}>
                          {event.title} - {new Date(event.date).toLocaleDateString()}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Cupos disponibles */}
                  {slots && (
                    <div className={`p-3 rounded border-2 ${slots.available > 0 ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'}`}>
                      <p className="text-sm font-medium">
                        Cupos: <span className="font-bold">{slots.occupied}/{slots.limit}</span>
                        {slots.available > 0
                          ? ` (${slots.available} disponibles)`
                          : ' - Sin cupos disponibles'}
                      </p>
                    </div>
                  )}

                  {isAlreadyRegistered ? (
                    <div className="p-4 bg-yellow-50 border-2 border-yellow-300 rounded">
                      <p className="text-yellow-700 font-medium">
                        Ya estás inscrito en el karaoke de este evento.
                      </p>
                    </div>
                  ) : (
                    <>
                      <Input
                        label="Nombre Completo"
                        name="fullName"
                        required
                        placeholder="Tu nombre completo"
                        value={formData.fullName}
                        onChange={handleChange}
                        icon={<User size={18} />}
                      />

                      <Input
                        label="Instagram"
                        name="instagram"
                        required
                        placeholder="@tu_usuario"
                        value={formData.instagram}
                        onChange={handleChange}
                        icon={<Instagram size={18} />}
                      />

                      <Input
                        label="Email"
                        name="email"
                        type="email"
                        required
                        placeholder="tu@email.com"
                        value={formData.email}
                        onChange={handleChange}
                        icon={<Mail size={18} />}
                      />

                      <div>
                        <Input
                          label="WhatsApp"
                          name="whatsapp"
                          required
                          placeholder="11 1234-5678"
                          value={formData.whatsapp}
                          onChange={handleChange}
                          icon={<Phone size={18} />}
                        />
                        {whatsappError && (
                          <p className="text-red-500 text-xs mt-1">{whatsappError}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <p className="text-xs text-gray-500">
                          Podés elegir hasta 3 canciones. Solo cantarás 1 opción el día del evento.
                        </p>
                        <Input
                          label="Canción 1 (obligatoria)"
                          name="songName"
                          required
                          placeholder="Nombre de la canción - Artista/Anime"
                          value={formData.songName}
                          onChange={handleChange}
                          icon={<Music size={18} />}
                        />
                        <Input
                          label="Canción 2 (opcional)"
                          name="songName2"
                          placeholder="Nombre de la canción - Artista/Anime"
                          value={formData.songName2}
                          onChange={handleChange}
                          icon={<Music size={18} />}
                        />
                        <Input
                          label="Canción 3 (opcional)"
                          name="songName3"
                          placeholder="Nombre de la canción - Artista/Anime"
                          value={formData.songName3}
                          onChange={handleChange}
                          icon={<Music size={18} />}
                        />
                      </div>

                      {error && (
                        <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded">
                          {error}
                        </div>
                      )}

                      <Button
                        type="submit"
                        disabled={submitting || (slots?.available === 0)}
                        className="w-full"
                      >
                        {submitting ? 'Enviando...' : 'Inscribirme'}
                      </Button>
                    </>
                  )}
                </form>
              )}
            </MangaCard>
          </div>

          {/* Mis inscripciones */}
          <div>
            <MangaCard className="p-6">
              <h3 className="text-lg font-bold mb-4">Mis Inscripciones</h3>

              {myRegistrations.length === 0 ? (
                <p className="text-gray-500 text-sm">No tenés inscripciones aún.</p>
              ) : (
                <div className="space-y-3">
                  {myRegistrations.map(reg => (
                    <div key={reg.id} className="p-3 bg-gray-50 rounded border">
                      <div className="flex justify-between items-start mb-1">
                        <p className="font-medium text-sm">{reg.event?.title || 'Evento'}</p>
                        {getStatusBadge(reg.status)}
                      </div>
                      <div className="text-xs text-gray-600">
                        <p className="flex items-center gap-1">
                          <Music size={12} /> Opciones:
                        </p>
                        <ul className="ml-5 list-disc">
                          {[reg.songName, reg.songName2, reg.songName3]
                            .filter(Boolean)
                            .map((song, idx) => (
                              <li key={`${reg.id}-song-${idx}`}>{song}</li>
                            ))}
                        </ul>
                      </div>
                      {reg.assignedNumber && (
                        <p className="text-xs text-green-600 font-medium mt-1">
                          Número asignado: #{reg.assignedNumber}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </MangaCard>

            {/* Info adicional */}
            <MangaCard className="p-6 mt-4 bg-gray-50">
              <h4 className="font-bold mb-2">Información</h4>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• Solo {slots?.limit || 12} cupos por evento</li>
                <li>• Tu inscripción debe ser aprobada</li>
                <li>• Te contactaremos por WhatsApp</li>
                <li>• Podés proponer hasta 3 canciones (se elegirá 1)</li>
                <li>• Animate a cantar lo que quieras: openings de anime, canciones de videojuegos, J-Pop y más. ¡Karaoke libre!</li>
              </ul>
            </MangaCard>
          </div>
        </div>
      )}
    </div>
  );
};
