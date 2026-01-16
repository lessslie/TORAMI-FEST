import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapPin, Calendar, Umbrella, CloudRain, Ticket, Star, Sparkles, Navigation, Bus, TrainFront, TramFront, CalendarPlus, Share2, ChevronLeft, ChevronRight } from 'lucide-react';
import { SectionTitle, MangaCard, Badge, Button } from '../components/UI';
import { ImageCarousel } from '../components/ImageCarousel';
import { getEventById } from '../services/data';
import { api } from '../services/api';
import { Event } from '../types';

export const EventsList = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 0 });

  useEffect(() => {
    setLoading(true);
    api.events.getAll(true, page, 10)
      .then(response => {
        setEvents(response.data);
        setPagination(response.pagination);
      })
      .finally(() => setLoading(false));
  }, [page]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <SectionTitle>
         <span className="flex items-center gap-3">
            <Calendar className="text-torami-red transform -rotate-6" /> Calendario de Eventos
         </span>
      </SectionTitle>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {loading ? (
          [1, 2, 3, 4, 5, 6].map((n) => (
            <MangaCard key={n} className="h-full animate-pulse">
              <div className="aspect-video bg-gray-300 mb-4 border-2 border-black"></div>
              <div className="h-6 bg-gray-300 rounded mb-2 w-3/4"></div>
              <div className="space-y-2 mb-4">
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </MangaCard>
          ))
        ) : events.map(event => (
          <Link to={`/eventos/${event.id}`} key={event.id}>
             <MangaCard className="h-full group">
               <div className="aspect-video bg-black mb-4 overflow-hidden border-2 border-black relative">
                 <img
                   src={event.images?.[0] || 'https://via.placeholder.com/400'}
                   alt={event.title}
                   className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500"
                   loading="lazy"
                 />
                 {event.isFeatured && (
                   <div className="absolute top-0 right-0 p-2">
                     <Star className="text-yellow-400 fill-current w-8 h-8 drop-shadow-md animate-pulse" />
                   </div>
                 )}
               </div>
               <div className="flex items-start justify-between mb-2">
                 <h3 className="font-display text-2xl leading-tight">{event.title}</h3>
                 {event.isFeatured && <Badge>Destacado</Badge>}
               </div>
               <div className="space-y-2 text-sm text-gray-600 mb-4">
                 <p className="flex items-center gap-2"><Calendar size={16} className="text-torami-red"/> {new Date(event.date).toLocaleDateString()} {event.time}</p>
                 <p className="flex items-center gap-2"><MapPin size={16} className="text-torami-red"/> {event.location}</p>
                 <p className="flex items-center gap-2">
                   <Ticket size={16} className="text-torami-red"/>
                   {event.isFree ? (
                     <span className="font-bold text-green-600">GRATIS</span>
                   ) : (
                     <span className="font-bold">${event.ticketPrice?.toLocaleString('es-AR')}</span>
                   )}
                 </p>
               </div>
               <div className="flex flex-wrap gap-2">
                 {event.tags.map(tag => (
                   <span key={tag} className="text-xs font-bold border border-gray-300 px-2 py-1 rounded bg-gray-50 flex items-center gap-1">
                     <Sparkles size={10} className="text-purple-400" /> {tag}
                   </span>
                 ))}
               </div>
             </MangaCard>
          </Link>
        ))}
      </div>

      {/* Pagination Controls */}
      {pagination.totalPages > 1 && (
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button
            variant="outline"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={20} /> Anterior
          </Button>

          <span className="text-sm font-bold">
            Página {pagination.page} de {pagination.totalPages}
          </span>

          <Button
            variant="outline"
            onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
            disabled={page === pagination.totalPages}
            className="flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Siguiente <ChevronRight size={20} />
          </Button>
        </div>
      )}
    </div>
  );
};

const TransportCard = ({ icon: Icon, title, description, colorClass }: { icon: any, title: string, description: string, colorClass: string }) => (
  <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-3 md:p-4 flex items-start md:items-center gap-3 md:gap-4 hover:border-torami-red transition-colors shadow-sm">
      <div className={`p-1.5 md:p-2 rounded-lg bg-neutral-800 ${colorClass} flex-shrink-0`}>
          <Icon size={20} className="md:w-6 md:h-6" />
      </div>
      <div className="flex-grow min-w-0">
          <h4 className="text-white font-bold text-base md:text-lg">{title}</h4>
          <p className="text-gray-300 text-xs md:text-sm leading-tight break-words">{description}</p>
      </div>
  </div>
);

export const EventDetail = () => {
  const { id } = useParams<{id: string}>();
  const [event, setEvent] = useState<Event | null>(null);

  useEffect(() => {
    if(id) getEventById(id).then(setEvent);
  }, [id]);

  if (!event) return <div className="p-12 text-center flex flex-col items-center gap-4"><Sparkles className="animate-spin text-torami-red" /> Cargando...</div>;

  // Generate Google Maps Directions URL
  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(event.location)}`;

  // Generate Google Calendar Link
  const createCalendarLink = () => {
    // Basic date parsing (expects YYYY-MM-DD and HH:MM range)
    // For a real app, use date-fns or similar
    const cleanDate = event.date.replace(/-/g, '');
    // Estimate start/end from string "12:00 - 20:00"
    const [startT, endT] = event.time.split(' - ');
    const startTime = startT ? startT.replace(':', '') + '00' : '120000';
    const endTime = endT ? endT.replace(':', '') + '00' : '200000';
    
    const dates = `${cleanDate}T${startTime}/${cleanDate}T${endTime}`;
    const details = encodeURIComponent(event.description);
    const location = encodeURIComponent(event.location);
    const title = encodeURIComponent(event.title);
    
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&dates=${dates}&details=${details}&location=${location}&text=${title}`;
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: event.title,
          text: `¡Vamos a ${event.title}! ${event.date} en ${event.location}.`,
          url: window.location.href,
        });
      } catch (error) {
      }
    } else {
      alert('¡Enlace copiado al portapapeles!');
      navigator.clipboard.writeText(window.location.href);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="mb-4 md:mb-6 flex justify-between items-center gap-2">
        <Link to="/proximos-eventos" className="text-xs md:text-sm underline hover:text-torami-red flex-shrink-0">← Volver</Link>
        <div className="flex gap-2">
            <button
                onClick={handleShare}
                className="flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1 bg-white border border-black hover:bg-gray-100 text-xs md:text-sm font-bold rounded"
            >
                <Share2 size={14} className="md:w-4 md:h-4" /> <span className="hidden sm:inline">Compartir</span>
            </button>
        </div>
      </div>
      
      <div className="relative h-64 md:h-96 lg:h-[500px] w-full mb-8 border-2 border-black shadow-manga overflow-hidden">
        <ImageCarousel
          images={event.images}
          autoPlayInterval={5000}
          className="h-full"
        />
        <div className="absolute bottom-2 left-2 md:bottom-4 md:left-4 bg-black text-white px-3 md:px-6 py-1 md:py-2 font-display text-sm md:text-xl uppercase skew-x-6 md:skew-x-12 border-2 border-white z-10">
          <span className="-skew-x-6 md:-skew-x-12 block flex items-center gap-1 md:gap-2">
            <Calendar size={14} className="md:w-[18px] md:h-[18px]" /> {new Date(event.date).toLocaleDateString()}
          </span>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Main Content */}
        <div className="flex-grow">
          <h1 className="font-display text-3xl md:text-4xl lg:text-5xl mb-4 text-stroke-sm bg-white/70 backdrop-blur-sm px-3 md:px-4 py-2 md:py-3 border-2 border-black shadow-md break-words">{event.title}</h1>

          <div className="flex gap-2 mb-6 flex-wrap">
            {event.tags.map(tag => (
               <Badge key={tag} color="blue">{tag}</Badge>
            ))}
          </div>

          <p className="text-base md:text-lg leading-relaxed mb-8 bg-white/60 backdrop-blur-sm p-3 md:p-4 border border-black/20 shadow-sm">{event.description}</p>

          <div className="bg-blue-50/90 backdrop-blur-sm p-3 md:p-4 border border-black mb-6 relative overflow-hidden shadow-md">
            <CloudRain className="absolute -right-2 md:-right-4 -bottom-2 md:-bottom-4 text-blue-100 w-16 h-16 md:w-24 md:h-24" />
            <h3 className="font-bold mb-2 flex items-center gap-2 relative z-10 text-sm md:text-base">
               {event.rainCheck ? <Umbrella size={18} className="text-blue-500 md:w-5 md:h-5"/> : <Sparkles size={18} className="text-yellow-500 md:w-5 md:h-5"/>}
               Información Climática
            </h3>
            <p className="text-xs md:text-sm relative z-10">
              {event.rainCheck
                ? "Este evento SE SUSPENDE por lluvia. Atentos a redes sociales."
                : "NO se suspende por lluvia."}
            </p>
          </div>
        </div>

        {/* Sidebar: Location & Transport */}
        <div className="lg:w-96 flex-shrink-0 space-y-6">
           {/* Action Buttons for Date */}
           <a href={createCalendarLink()} target="_blank" rel="noreferrer" className="block">
                <Button variant="outline" className="w-full flex items-center justify-center gap-1 md:gap-2 mb-4 bg-white/90 backdrop-blur-sm hover:bg-red-50 hover:text-torami-red hover:border-torami-red shadow-md text-xs md:text-sm py-2 md:py-3">
                    <CalendarPlus size={16} className="md:w-5 md:h-5" /> <span className="break-words">Agendar en Google Calendar</span>
                </Button>
           </a>

           {/* Precio de entrada */}
           <MangaCard className={`border-t-4 ${event.isFree ? 'border-t-green-500' : 'border-t-yellow-500'} bg-white/85 backdrop-blur-sm shadow-lg`}>
              <div className="flex items-start justify-between mb-4">
                 <div className="flex-grow min-w-0">
                    <h3 className="font-display text-xl md:text-2xl uppercase">Entrada</h3>
                    {event.isFree ? (
                      <p className="text-xl md:text-2xl font-black text-green-600">GRATIS</p>
                    ) : (
                      <p className="text-xl md:text-2xl font-black text-gray-900 break-words">${event.ticketPrice?.toLocaleString('es-AR')}</p>
                    )}
                 </div>
                 <Ticket className={`${event.isFree ? 'text-green-500' : 'text-yellow-500'} w-6 h-6 md:w-8 md:h-8 flex-shrink-0`} />
              </div>

              {!event.isFree && event.ticketLink && (
                <a href={event.ticketLink} target="_blank" rel="noreferrer">
                  <Button className="w-full text-xs md:text-sm flex items-center justify-center gap-2 py-2 md:py-3">
                    <Ticket size={16} className="md:w-[18px] md:h-[18px]" /> Comprar Entrada
                  </Button>
                </a>
              )}
           </MangaCard>

           <MangaCard className="border-t-4 border-t-torami-red bg-white/85 backdrop-blur-sm shadow-lg">
              <div className="flex items-start justify-between mb-4 gap-2">
                 <div className="flex-grow min-w-0">
                    <h3 className="font-display text-xl md:text-2xl uppercase">Ubicación</h3>
                    <p className="text-xs md:text-sm text-gray-500 font-bold break-words">{event.location}</p>
                 </div>
                 <MapPin className="text-torami-red w-6 h-6 md:w-8 md:h-8 flex-shrink-0" />
              </div>

              <a href={mapsUrl} target="_blank" rel="noreferrer">
                <Button className="w-full text-xs md:text-sm flex items-center justify-center gap-2 py-2 md:py-3 bg-black text-white hover:bg-gray-800">
                  <Navigation size={16} className="md:w-[18px] md:h-[18px]" /> Cómo llegar (Google Maps)
                </Button>
              </a>
           </MangaCard>

           {/* Transport Section - Dark Cards Style */}
           {(event.transport?.subway || event.transport?.bus || event.transport?.train) && (
             <div className="bg-black/90 backdrop-blur-sm p-3 md:p-4 rounded-xl border-2 border-black shadow-manga">
                <h3 className="text-white font-display text-lg md:text-xl mb-3 md:mb-4 flex items-center gap-2 border-b border-gray-700 pb-2">
                  <span className="text-torami-red break-words">Medios de Transporte</span>
                </h3>
                
                <div className="space-y-3">
                   {event.transport?.subway && (
                      <TransportCard 
                        icon={TramFront} 
                        title="Subte" 
                        description={event.transport.subway} 
                        colorClass="text-purple-400"
                      />
                   )}
                   {event.transport?.bus && (
                      <TransportCard 
                        icon={Bus} 
                        title="Colectivo" 
                        description={event.transport.bus} 
                        colorClass="text-pink-400"
                      />
                   )}
                   {event.transport?.train && (
                      <TransportCard 
                        icon={TrainFront} 
                        title="Tren" 
                        description={event.transport.train} 
                        colorClass="text-yellow-400"
                      />
                   )}
                </div>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};
