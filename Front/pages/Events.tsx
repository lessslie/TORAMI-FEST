import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapPin, Calendar, Umbrella, CloudRain, Ticket, Star, Sparkles, Navigation, Bus, TrainFront, TramFront, CalendarPlus, Share2 } from 'lucide-react';
import { SectionTitle, MangaCard, Badge, Button } from '../components/UI';
import { ImageCarousel } from '../components/ImageCarousel';
import { getUpcomingEvents, getEventById } from '../services/data';
import { Event } from '../types';

export const EventsList = () => {
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    getUpcomingEvents().then(setEvents);
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <SectionTitle>
         <span className="flex items-center gap-3">
            <Calendar className="text-torami-red transform -rotate-6" /> Calendario de Eventos
         </span>
      </SectionTitle>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {events.map(event => (
          <Link to={`/eventos/${event.id}`} key={event.id}>
             <MangaCard className="h-full group">
               <div className="aspect-video bg-black mb-4 overflow-hidden border-2 border-black relative">
                 <img src={event.images[0] || 'https://via.placeholder.com/400'} alt={event.title} className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500"/>
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
    </div>
  );
};

const TransportCard = ({ icon: Icon, title, description, colorClass }: { icon: any, title: string, description: string, colorClass: string }) => (
  <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-4 flex items-center gap-4 hover:border-torami-red transition-colors shadow-sm">
      <div className={`p-2 rounded-lg bg-neutral-800 ${colorClass}`}>
          <Icon size={24} />
      </div>
      <div>
          <h4 className="text-white font-bold text-lg">{title}</h4>
          <p className="text-gray-300 text-sm leading-tight">{description}</p>
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
        console.log('Error sharing', error);
      }
    } else {
      alert('¡Enlace copiado al portapapeles!');
      navigator.clipboard.writeText(window.location.href);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="mb-6 flex justify-between items-center">
        <Link to="/proximos-eventos" className="text-sm underline hover:text-torami-red">← Volver a eventos</Link>
        <div className="flex gap-2">
            <button 
                onClick={handleShare}
                className="flex items-center gap-2 px-3 py-1 bg-white border border-black hover:bg-gray-100 text-sm font-bold rounded"
            >
                <Share2 size={16} /> <span className="hidden sm:inline">Compartir</span>
            </button>
        </div>
      </div>
      
      <div className="relative h-64 md:h-96 lg:h-[500px] w-full mb-8 border-2 border-black shadow-manga">
        <ImageCarousel
          images={event.images}
          autoPlayInterval={5000}
          className="h-full"
        />
        <div className="absolute bottom-0 left-0 bg-black text-white px-6 py-2 font-display text-xl uppercase skew-x-12 ml-4 mb-4 border-2 border-white z-10">
          <span className="-skew-x-12 block flex items-center gap-2">
            <Calendar size={18} /> {new Date(event.date).toLocaleDateString()}
          </span>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Main Content */}
        <div className="flex-grow">
          <h1 className="font-display text-4xl md:text-5xl mb-4 text-stroke-sm">{event.title}</h1>
          
          <div className="flex gap-2 mb-6">
            {event.tags.map(tag => (
               <Badge key={tag} color="blue">{tag}</Badge>
            ))}
          </div>

          <p className="text-lg leading-relaxed mb-8">{event.description}</p>

          <div className="bg-blue-50 p-4 border border-black mb-6 relative overflow-hidden">
            <CloudRain className="absolute -right-4 -bottom-4 text-blue-100 w-24 h-24" />
            <h3 className="font-bold mb-2 flex items-center gap-2 relative z-10">
               {event.rainCheck ? <Umbrella size={20} className="text-blue-500"/> : <Sparkles size={20} className="text-yellow-500"/>}
               Información Climática
            </h3>
            <p className="text-sm relative z-10">
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
                <Button variant="outline" className="w-full flex items-center justify-center gap-2 mb-4 bg-white hover:bg-red-50 hover:text-torami-red hover:border-torami-red">
                    <CalendarPlus size={20} /> Agendar en Google Calendar
                </Button>
           </a>

           {/* Precio de entrada */}
           <MangaCard className={`border-t-4 ${event.isFree ? 'border-t-green-500' : 'border-t-yellow-500'}`}>
              <div className="flex items-start justify-between mb-4">
                 <div>
                    <h3 className="font-display text-2xl uppercase">Entrada</h3>
                    {event.isFree ? (
                      <p className="text-2xl font-black text-green-600">GRATIS</p>
                    ) : (
                      <p className="text-2xl font-black text-gray-900">${event.ticketPrice?.toLocaleString('es-AR')}</p>
                    )}
                 </div>
                 <Ticket className={`${event.isFree ? 'text-green-500' : 'text-yellow-500'} w-8 h-8`} />
              </div>

              {!event.isFree && event.ticketLink && (
                <a href={event.ticketLink} target="_blank" rel="noreferrer">
                  <Button className="w-full text-sm flex items-center justify-center gap-2 py-3">
                    <Ticket size={18} /> Comprar Entrada
                  </Button>
                </a>
              )}
           </MangaCard>

           <MangaCard className="border-t-4 border-t-torami-red">
              <div className="flex items-start justify-between mb-4">
                 <div>
                    <h3 className="font-display text-2xl uppercase">Ubicación</h3>
                    <p className="text-sm text-gray-500 font-bold">{event.location}</p>
                 </div>
                 <MapPin className="text-torami-red w-8 h-8" />
              </div>
              
              <a href={mapsUrl} target="_blank" rel="noreferrer">
                <Button className="w-full text-sm flex items-center justify-center gap-2 py-3 bg-black text-white hover:bg-gray-800">
                  <Navigation size={18} /> Cómo llegar (Google Maps)
                </Button>
              </a>
           </MangaCard>

           {/* Transport Section - Dark Cards Style */}
           {(event.transport?.subway || event.transport?.bus || event.transport?.train) && (
             <div className="bg-black p-4 rounded-xl border-2 border-black shadow-manga">
                <h3 className="text-white font-display text-xl mb-4 flex items-center gap-2 border-b border-gray-700 pb-2">
                  <span className="text-torami-red">Medios de Transporte</span>
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

           <MangaCard className="bg-torami-red text-white border-black relative overflow-hidden">
              <Ticket className="absolute -right-2 -top-2 text-white opacity-20 w-24 h-24 rotate-12" />
              <h3 className="font-bold text-lg mb-2 flex items-center gap-2"><Ticket /> Entradas</h3>
              <p className="text-sm mb-4">Conseguí tu anticipada online antes de que se agoten.</p>
              <Button variant="secondary" className="w-full font-bold">Comprar Ticket</Button>
           </MangaCard>
        </div>
      </div>
    </div>
  );
};
