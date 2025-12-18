import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Gift, Instagram, ArrowRight, Gamepad2, Cat, Sparkles, Zap, Heart, Ticket } from 'lucide-react';
import { MangaCard, Button, SectionTitle, Badge, Countdown } from '../components/UI';
import { getUpcomingEvents, getActiveSponsors, getConfig } from '../services/data';
import { Event, Sponsor, AppConfig } from '../types';

export const Home = () => {
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [config, setAppConfig] = useState<AppConfig | null>(null);
  const [isGalleryPaused, setIsGalleryPaused] = useState(false);

  useEffect(() => {
    getUpcomingEvents().then(data => setUpcomingEvents(data));
    getActiveSponsors().then(setSponsors);
    getConfig().then(setAppConfig);
  }, []);

  const galleryImages = config?.homeGalleryImages || [];
  // Duplicar las imágenes para loop infinito
  const marqueeImages = galleryImages.length > 0 ? [...galleryImages, ...galleryImages] : [];

  const nextEvent = upcomingEvents[0];
  const otherEvents = upcomingEvents.slice(1, 4); 

  return (
    <div className="pb-12">
      {/* Hero Section */}
      <section className="relative bg-white border-b-2 border-black overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/halftone.png')]"></div>
        
        {/* Kawaii Decorative Elements */}
        <Cat className="absolute top-10 left-5 md:left-20 text-gray-200 w-24 h-24 -rotate-12" strokeWidth={1.5} />
        <Gamepad2 className="absolute bottom-10 right-5 md:right-20 text-red-100 w-32 h-32 rotate-12" strokeWidth={1.5} />

        <div className="max-w-7xl mx-auto px-4 py-12 md:py-16 flex flex-col items-center text-center relative z-10">
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-black overflow-hidden mb-4 shadow-manga animate-bounce-slow relative">
             <img src="/torami_fest_logo_circle.png" alt="Torami Logo" className="w-full h-full object-cover" />
             <Sparkles className="absolute -top-2 -right-4 text-yellow-400 w-8 h-8 animate-pulse" fill="currentColor" />
          </div>
          
          {/* Dynamic Hero Title & Slogan */}
          <h1 className="font-script text-4xl md:text-6xl italic tracking-tight mb-2 break-words max-w-full text-torami-red">
            {config?.heroTitle || 'Torami Fest'}
          </h1>
          <p className="text-lg md:text-xl font-bold bg-black text-white px-4 py-1 transform -rotate-2 inline-block mb-6 shadow-md">
            {config?.heroSubtitle || 'Evento de anime, gaming y cultura pop'}
          </p>
          
          {/* Subtle Next Event Pill */}
          {nextEvent && (
            <Link to={`/eventos/${nextEvent.id}`} className="mb-6 group animate-in fade-in zoom-in-95 duration-700">
              <div className="inline-flex items-center gap-3 px-5 py-2.5 bg-white/90 backdrop-blur-sm border border-gray-300 rounded-full shadow-sm hover:shadow-md hover:border-torami-red transition-all cursor-pointer">
                 <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-torami-red"></span>
                 </span>
                 <div className="flex flex-col md:flex-row md:items-center gap-0 md:gap-2 text-sm text-left">
                    <span className="font-bold text-black uppercase text-xs md:text-sm">Próximo:</span>
                    <span className="text-gray-700 group-hover:text-torami-red transition-colors flex items-center gap-2">
                       <span className="font-medium">{config?.heroDateText || new Date(nextEvent.date).toLocaleDateString()}</span>
                       <span className="hidden md:inline text-gray-300">|</span>
                       <span className="text-gray-500 group-hover:text-torami-red truncate max-w-[150px] md:max-w-xs block md:inline">
                         {nextEvent.location}
                       </span>
                    </span>
                 </div>
                 <ArrowRight size={16} className="text-gray-400 group-hover:translate-x-1 group-hover:text-torami-red transition-transform ml-1 flex-shrink-0" />
              </div>
            </Link>
          )}

          {/* HYPE COUNTDOWN (Smaller & Elegant) */}
          {nextEvent && (
            <div className="mb-8 flex flex-col items-center gap-2">
              <p className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">Tiempo restante</p>
              <Countdown targetDate={`${nextEvent.date}T${nextEvent.time.split(' - ')[0]}:00`} />
            </div>
          )}

          <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
            <Link to="/proximos-eventos" className="w-full md:w-auto">
              <Button className="w-full flex items-center justify-center gap-2 text-lg py-4">
                <Calendar size={22} /> Ver Próximos Eventos
              </Button>
            </Link>
            <Link to="/quiero-un-stand" className="w-full md:w-auto">
               <Button variant="secondary" className="w-full flex items-center justify-center gap-2 text-lg py-4">
                 <Zap size={22} className="text-yellow-500 fill-current" /> Quiero un Stand
               </Button>
            </Link>
          </div>

          {config?.donationsEnabled && (
            <div className="mt-8 md:hidden w-full">
               <Link to="/donar">
                <Button variant="outline" className="w-full border-torami-red text-torami-red animate-pulse">
                  <Heart className="inline mr-2 w-4 h-4 fill-current" /> Apoyá Torami Fest
                </Button>
               </Link>
            </div>
          )}
        </div>
      </section>

      {/* Mini Gallery Carousel */}
      <div className="border-b-2 border-black bg-gray-900/5 py-6 relative overflow-hidden">
        <div className="absolute inset-y-0 left-0 w-16 md:w-24 bg-gradient-to-r from-white via-white/60 to-transparent pointer-events-none z-10"></div>
        <div className="absolute inset-y-0 right-0 w-16 md:w-24 bg-gradient-to-l from-white via-white/60 to-transparent pointer-events-none z-10"></div>
        <div
          className="gallery-marquee-container"
          onMouseEnter={() => setIsGalleryPaused(true)}
          onMouseLeave={() => setIsGalleryPaused(false)}
        >
          <div className={`gallery-marquee ${isGalleryPaused ? 'paused' : ''}`}>
            {marqueeImages.map((img, i) => (
              <div
                key={i}
                data-gallery-card
                className="gallery-card relative min-w-[200px] sm:min-w-[240px] md:min-w-[280px] h-[250px] sm:h-[280px] md:h-[300px] rounded-xl overflow-hidden border-2 border-black shadow-manga bg-black group transition-transform duration-300 hover:-translate-y-1 hover:scale-[1.05] flex-shrink-0"
              >
                <img
                  src={img}
                  alt="Gallery"
                  className="w-full h-full object-cover bg-black filter grayscale group-hover:grayscale-0 group-hover:saturate-125 transition-all duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-60 group-hover:opacity-30 transition-opacity"></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12 space-y-16">
        
        {/* Next Events Grid */}
        <section>
          <div className="flex justify-between items-end mb-8">
            <SectionTitle>
              <span className="flex items-center gap-3">
                 <Gamepad2 className="text-torami-red w-8 h-8 md:w-10 md:h-10 transform -rotate-12" />
                 Próximos Eventos
              </span>
            </SectionTitle>
            <Link to="/proximos-eventos" className="text-sm font-bold underline hover:text-torami-red flex items-center gap-1">Ver todos <ArrowRight size={14} /></Link>
          </div>
          
          {upcomingEvents.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {upcomingEvents.map(event => (
                <Link to={`/eventos/${event.id}`} key={event.id}>
                  <MangaCard className="h-full flex flex-col relative overflow-hidden">
                     <div className="h-40 bg-gray-200 mb-4 border-2 border-black overflow-hidden relative">
                        <img src={event.images[0] || 'https://via.placeholder.com/400'} alt={event.title} className="w-full h-full object-cover"/>
                        {event.isFeatured && (
                          <div className="absolute top-2 right-2">
                            <Badge>
                               <span className="flex items-center gap-1"><Sparkles size={10} /> Destacado</span>
                            </Badge>
                          </div>
                        )}
                     </div>
                     <h3 className="font-display text-xl mb-2">{event.title}</h3>
                     <div className="space-y-2 text-sm flex-grow">
                        <div className="flex items-center gap-2">
                          <Calendar size={16} className="text-torami-red" />
                          <span>{new Date(event.date).toLocaleDateString()} • {event.time}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin size={16} className="text-torami-red" />
                          <span className="truncate">{event.location}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Ticket size={16} className="text-torami-red" />
                          {event.isFree ? (
                            <span className="font-bold text-green-600">GRATIS</span>
                          ) : (
                            <span className="font-bold">${event.ticketPrice?.toLocaleString('es-AR')}</span>
                          )}
                        </div>
                     </div>
                  </MangaCard>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 italic flex items-center gap-2">
              <Cat size={20} /> No hay otros eventos próximos por ahora.
            </p>
          )}
        </section>

        {/* Giveaways Teaser */}
        <section className="bg-black text-white p-6 -mx-4 md:mx-0 md:rounded-lg border-y-2 md:border-2 border-torami-red relative overflow-hidden group">
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <h3 className="font-display text-3xl text-yellow-400 mb-2 flex items-center justify-center md:justify-start gap-2">
                <Gift className="animate-bounce-slow" /> ¡Sorteos Activos!
              </h3>
              <p className="text-gray-300">Ganá entradas, figuras y más participando gratis.</p>
            </div>
            <Link to="/sorteos">
              <button className="bg-yellow-400 text-black font-bold uppercase px-8 py-3 transform -skew-x-12 hover:bg-white transition-colors border-2 border-white flex items-center gap-2">
                <Sparkles size={18} /> Participar
              </button>
            </Link>
          </div>
          <Gift className="absolute -right-10 -bottom-10 text-gray-800 w-64 h-64 opacity-20 rotate-12 group-hover:rotate-6 transition-transform" />
        </section>

        {/* Sponsors */}
        <section>
           <SectionTitle>
             <span className="flex items-center gap-2">
               <Heart className="text-pink-500 fill-current w-8 h-8 animate-pulse" />
               Nos Acompañan
             </span>
           </SectionTitle>
           <div className="flex flex-wrap justify-center gap-8 items-center">
              {sponsors.map(sponsor => (
                <a href={sponsor.link} key={sponsor.id} target="_blank" rel="noreferrer" className="grayscale hover:grayscale-0 transition-all opacity-70 hover:opacity-100 hover:scale-105">
                  <img src={sponsor.logoUrl} alt={sponsor.name} className="h-12 md:h-16 object-contain" />
                </a>
              ))}
           </div>
        </section>

        {/* Instagram CTA */}
        <div className="flex justify-center">
           <a href="https://instagram.com/torami.fest" target="_blank" rel="noreferrer">
             <Button variant="outline" className="flex items-center gap-2 bg-white hover:text-pink-600">
                <Instagram size={20} />
                Seguinos en Instagram
             </Button>
           </a>
        </div>
      </div>
    </div>
  );
};
