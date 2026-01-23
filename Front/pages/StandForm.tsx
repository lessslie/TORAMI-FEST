import React, { useState, useRef, useEffect } from 'react';
import { SectionTitle, MangaCard, Input, Button } from '../components/UI';
import { addStandApplication, getUpcomingEvents, getConfig, getUserStands, uploadImageToCloudinary } from '../services/data';
import { StandApplication, Event, AppConfig } from '../types';
import { Store, Coffee, CheckCircle, Send, ShoppingBag, Upload, X, Image, AlertCircle, Calendar } from 'lucide-react';
import { useAuth } from '../App';
import { useNavigate } from 'react-router-dom';

export const StandForm = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Estado de configuración (inscripciones abiertas/cerradas)
  const [inscripcionesAbiertas, setInscripcionesAbiertas] = useState<boolean | null>(null);

  const [events, setEvents] = useState<Event[]>([]);
  const [formData, setFormData] = useState({
    brandName: '',
    type: 'Merch',
    contactName: '',
    email: '',
    phone: '',
    socials: '',
    description: '',
    needs: '',
    otherType: '',
    eventId: ''
  });

  const [images, setImages] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [whatsappError, setWhatsappError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // User's existing stand applications
  const [myStands, setMyStands] = useState<StandApplication[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load config para saber si inscripciones están abiertas
        const configData = await getConfig();
        setInscripcionesAbiertas(configData.standsInscripcionesAbiertas !== false);

        const upcomingEvents = await getUpcomingEvents();
        setEvents(upcomingEvents);
        // Auto-select the first event if available
        if (upcomingEvents.length > 0) {
          setFormData(prev => ({ ...prev, eventId: upcomingEvents[0].id }));
        }

        // Load user's existing stand applications
        if (user) {
          const userStands = await getUserStands(user.id);
          setMyStands(userStands || []);
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

    // Validación especial para el campo de teléfono/WhatsApp
    if (name === 'phone') {
      if (!validateWhatsapp(value)) {
        setWhatsappError('Solo se permiten números, espacios, guiones y +');
        return; // No actualizar el valor si contiene caracteres inválidos
      } else {
        setWhatsappError(null);
      }
    }

    setFormData({ ...formData, [name]: value });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      if (images.length >= 5) {
        setError("Máximo 5 fotos permitidas.");
        return;
      }

      const file = e.target.files[0];

      // Validar que sea una imagen
      if (!file.type.startsWith('image/')) {
        setError("Solo se permiten archivos de imagen.");
        return;
      }

      setIsCompressing(true);
      setError(null);

      try {
        // Subir a Cloudinary y obtener URL
        const imageUrl = await uploadImageToCloudinary(file);
        setImages(prev => [...prev, imageUrl]);
      } catch (err: any) {
        setError(err.message || "Error al subir la imagen. Intentá con otra.");
        console.error('Error uploading image:', err);
      } finally {
        setIsCompressing(false);
      }

      // Reset input to allow selecting the same file again if deleted
      e.target.value = '';
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Verificar si el usuario está logueado
    if (!user) {
      setError('Debes iniciar sesión para solicitar un stand');
      return;
    }

    if (!formData.eventId) {
      setError('Debes seleccionar un evento para tu stand');
      return;
    }

    if (images.length === 0) {
      setError("Debes subir al menos 1 foto de tu mercadería.");
      return;
    }

    const finalType = formData.type === 'Otros' ? formData.otherType : formData.type;

    setIsSubmitting(true);
    try {
      // Only send fields that the DTO accepts
      await addStandApplication({
        brandName: formData.brandName,
        type: finalType,
        contactName: formData.contactName,
        email: formData.email,
        phone: formData.phone,
        socials: formData.socials,
        description: formData.description,
        needs: formData.needs,
        eventId: formData.eventId,
        images: images
      });
      setSubmitted(true);
    } catch (err: any) {
      if (err.response?.status === 401) {
        setError('Debes iniciar sesión para solicitar un stand');
      } else {
        setError(err.message || 'Error al enviar la solicitud. Por favor intentá de nuevo.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <MangaCard className="py-12 bg-green-50 border-green-800 flex flex-col items-center">
          <CheckCircle className="text-green-600 w-16 h-16 mb-4" />
          <h2 className="font-display text-3xl mb-4">¡Solicitud Enviada!</h2>
          <p className="mb-6">El equipo de Torami Fest revisará tu propuesta. Te contactaremos pronto.</p>
          <Button onClick={() => {
            setSubmitted(false);
            setImages([]);
            setFormData({
              brandName: '',
              type: 'Merch',
              contactName: '',
              email: '',
              phone: '',
              socials: '',
              description: '',
              needs: '',
              otherType: '',
              eventId: events.length > 0 ? events[0].id : ''
            });
          }}>Enviar otra</Button>
        </MangaCard>
      </div>
    );
  }

  // Pantalla de inscripciones cerradas (lee de la config de DB)
  if (inscripcionesAbiertas === false) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <SectionTitle>
          <span className="flex items-center gap-3">
            <Store className="text-torami-red transform -rotate-3" /> Quiero un Stand
          </span>
        </SectionTitle>
        <MangaCard className="bg-gray-100 border-gray-400 text-center py-16">
          <div className="text-6xl mb-4">🚫</div>
          <h2 className="text-2xl font-bold text-gray-700 mb-4">Inscripciones Cerradas</h2>
          <p className="text-gray-600 max-w-md mx-auto">
            Las inscripciones para stands están cerradas temporalmente. Volverán a habilitarse pronto.
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
      <div className="mb-12">
        <SectionTitle>
           <span className="flex items-center gap-3">
             <Store className="text-torami-red transform -rotate-3" /> Quiero un Stand
           </span>
        </SectionTitle>
        <MangaCard className="bg-red-50 mb-8 border-l-8 border-l-torami-red">
          <div className="flex items-start gap-4">
            <div className="hidden sm:block p-2 bg-white rounded-full border-2 border-black">
               <Coffee className="text-torami-red" />
            </div>
            <div>
              <h3 className="font-bold text-lg mb-2">Información para Expositores</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-800">
                <li>Buscamos propuestas originales de anime, gaming y cultura pop.</li>
                <li>El espacio incluye 1 mesa y 1 silla.</li>
                <li>Fecha límite para aplicar: 15 días antes del evento.</li>
              </ul>
            </div>
          </div>
        </MangaCard>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Event Selector */}
          <div>
            <label className="block text-sm font-bold mb-2 uppercase flex items-center gap-2">
              <Calendar size={16} className="text-torami-red" /> Evento al que te querés anotar *
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

          {/* Aviso si ya tiene un stand para este evento */}
          {myStands.some(s => s.eventId === formData.eventId) && (
            <div className="p-4 bg-yellow-50 border-2 border-yellow-300 rounded">
              <p className="text-yellow-700 font-medium">
                ⚠️ Ya tenés una solicitud de stand para este evento.
              </p>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-6">
            <Input name="brandName" label="Nombre del Stand" required onChange={handleChange} placeholder="Ej. Tienda Kawaii" />
            <Input name="contactName" label="Persona de Contacto" required onChange={handleChange} />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Input name="email" label="Email" type="email" required onChange={handleChange} />
            <div>
              <Input
                  name="phone"
                  label="Número de WhatsApp (Obligatorio)"
                  required
                  onChange={handleChange}
                  value={formData.phone}
                  placeholder="Ej: 11 1234-5678"
              />
              {whatsappError && (
                <p className="text-red-500 text-xs mt-1">{whatsappError}</p>
              )}
            </div>
          </div>

          <div>
             <label className="block text-sm font-bold mb-1 uppercase flex items-center gap-2">
               <ShoppingBag size={16} /> Tipo de Stand
             </label>
             <select 
                name="type" 
                className="w-full border-2 border-black p-3 bg-white focus:outline-none focus:shadow-manga"
                onChange={handleChange}
                value={formData.type}
             >
                <option value="Merch">Merch / Figuras / Prints</option>
                <option value="Comida">Comida (Maid Café / Asian Food)</option>
                <option value="Bebida">Bebida</option>
                <option value="Postres">Postres / Pastelería</option>
                <option value="Ilustraciones">Ilustraciones (Artist Alley)</option>
                <option value="Cosplay">Cosplay / Indumentaria</option>
                <option value="3D">Impresiones / Animaciones 3D</option>
                <option value="Videojuegos">Videojuegos / Arcades</option>
                <option value="Otros">Otro</option>
             </select>
          </div>

          {formData.type === 'Otros' && (
            <Input name="otherType" label="Especificar tipo" required onChange={handleChange} />
          )}

          <Input name="socials" label="Instagram / Web" placeholder="@usuario" onChange={handleChange} />
          
          <div>
            <label className="block text-sm font-bold mb-1 uppercase">Descripción del Stand</label>
            <textarea
              name="description"
              rows={4}
              className="w-full border-2 border-black p-3 bg-white focus:outline-none focus:shadow-manga"
              required
              onChange={handleChange}
              placeholder="Contanos qué vendés o qué servicio ofrecés..."
            ></textarea>
          </div>

          {/* Image Upload Section */}
          <div className="mb-6">
              <label className="block text-sm font-bold mb-2 uppercase flex items-center justify-between">
                  <span>Fotos de la Mercadería (Min 1 - Max 5)</span>
                  <span className="text-xs text-gray-500">{images.length}/5</span>
              </label>
              
              <div className="flex flex-wrap gap-2 mb-2">
                  {images.map((img, idx) => (
                      <div key={idx} className="relative w-20 h-20 border border-black group">
                          <img src={img} alt={`preview-${idx}`} className="w-full h-full object-cover" />
                          <button 
                            type="button" 
                            onClick={() => removeImage(idx)}
                            className="absolute top-0 right-0 bg-red-600 text-white p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                              <X size={12} />
                          </button>
                      </div>
                  ))}
                  
                  {images.length < 5 && (
                      <button
                        type="button"
                        onClick={() => !isCompressing && fileInputRef.current?.click()}
                        disabled={isCompressing}
                        className={`w-20 h-20 border-2 border-dashed border-gray-400 flex flex-col items-center justify-center text-gray-500 transition-colors bg-gray-50 ${isCompressing ? 'opacity-50 cursor-wait' : 'hover:text-torami-red hover:border-torami-red'}`}
                      >
                          {isCompressing ? (
                            <>
                              <div className="w-5 h-5 border-2 border-torami-red border-t-transparent rounded-full animate-spin mb-1"></div>
                              <span className="text-[10px] font-bold">Procesando</span>
                            </>
                          ) : (
                            <>
                              <Upload size={20} className="mb-1" />
                              <span className="text-[10px] font-bold">Subir</span>
                            </>
                          )}
                      </button>
                  )}
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleImageUpload} 
                  />
              </div>
              <p className="text-xs text-gray-500">Es importante para verificar la variedad de productos en el evento.</p>
          </div>

          <Input name="needs" label="Necesidades Especiales (Electricidad, espacio extra)" onChange={handleChange} />

          {error && (
            <MangaCard className="bg-red-50 border-red-500 border-l-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="text-red-600 flex-shrink-0 mt-1" size={24} />
                <div>
                  <h4 className="font-bold text-red-800 mb-2">Error en la solicitud</h4>
                  <p className="text-red-700">{error}</p>
                  {error.includes('iniciar sesión') && (
                    <Button
                      onClick={() => navigate('/login')}
                      className="mt-3 bg-red-600 hover:bg-red-700"
                    >
                      Iniciar Sesión
                    </Button>
                  )}
                </div>
              </div>
            </MangaCard>
          )}

          <Button type="submit" disabled={isSubmitting || myStands.some(s => s.eventId === formData.eventId)} className="w-full flex items-center justify-center gap-2">
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Enviando...
              </>
            ) : myStands.some(s => s.eventId === formData.eventId) ? (
              <>
                ⚠️ Ya tenés una solicitud para este evento
              </>
            ) : (
              <>
                <Send size={18} /> Enviar Postulación
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};
