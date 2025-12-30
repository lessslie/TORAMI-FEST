import React, { useEffect, useState } from 'react';
import { SectionTitle, MangaCard } from '../components/UI';
import { getOfficialGallery, getEvents } from '../services/data';
import { Event, GalleryItem } from '../types';
import { Camera, Filter, ZoomIn, Sparkles, Award, X } from 'lucide-react';

export const OfficialGallery = () => {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [filterEvent, setFilterEvent] = useState<string>('all');

  // Lightbox State
  const [selectedImage, setSelectedImage] = useState<GalleryItem | null>(null);

  useEffect(() => {
    getOfficialGallery().then(setItems);
    getEvents().then(setEvents);
  }, []);

  const filteredItems = filterEvent === 'all'
    ? items
    : items.filter(i => i.eventId === filterEvent);

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <SectionTitle>
           <span className="flex items-center gap-2">
             <Award className="text-torami-red transform rotate-12" /> Galería Oficial
           </span>
        </SectionTitle>
      </div>

      {/* Hero Banner */}
      <div className="mb-8 transform hover:scale-[1.01] transition-transform duration-300">
         <MangaCard className="bg-gradient-to-r from-red-50 to-pink-50 border-torami-red relative overflow-hidden">
             <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left relative z-10">
                 <div className="bg-white p-4 rounded-full border-2 border-black transform -rotate-12 shrink-0 shadow-sm">
                     <Camera size={40} className="text-torami-red" />
                 </div>
                 <div>
                     <h3 className="font-display text-2xl uppercase italic tracking-wider mb-1 text-black">
                         Momentos Oficiales de Torami Fest
                     </h3>
                     <p className="font-bold text-gray-800 text-lg">
                         Las mejores fotos de nuestros eventos, capturadas por el equipo organizador
                     </p>
                 </div>
             </div>
             {/* Decorative Sparkles */}
             <Sparkles className="absolute -right-6 -bottom-6 text-yellow-400 w-32 h-32 opacity-40 rotate-12 pointer-events-none" />
             <Sparkles className="absolute top-4 left-4 text-pink-400 w-6 h-6 opacity-60 animate-pulse pointer-events-none" />
         </MangaCard>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide">
         <Filter size={18} className="text-gray-500 mr-2 flex-shrink-0" />
         <button
            onClick={() => setFilterEvent('all')}
            className={`px-4 py-1 rounded-full text-sm font-bold whitespace-nowrap border border-black transition-all ${filterEvent === 'all' ? 'bg-black text-white' : 'bg-white hover:bg-gray-100'}`}
         >
            Todos
         </button>
         {events.map(ev => (
             <button
                key={ev.id}
                onClick={() => setFilterEvent(ev.id)}
                className={`px-4 py-1 rounded-full text-sm font-bold whitespace-nowrap border border-black transition-all ${filterEvent === ev.id ? 'bg-black text-white' : 'bg-white hover:bg-gray-100'}`}
             >
                {ev.title}
             </button>
         ))}
      </div>

      {/* Empty State */}
      {filteredItems.length === 0 && (
        <MangaCard className="text-center py-16 bg-gray-50">
          <Camera size={64} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 text-lg font-bold">No hay fotos oficiales aún</p>
          <p className="text-gray-400 text-sm">Volvé pronto para ver las fotos de nuestros eventos</p>
        </MangaCard>
      )}

      {/* Masonry Grid - Larger images for official gallery */}
      <div className="columns-1 md:columns-2 lg:columns-3 gap-4 space-y-4">
        {filteredItems.map(item => (
            <div key={item.id} className="break-inside-avoid relative group cursor-pointer" onClick={() => setSelectedImage(item)}>
                <div className="border-2 border-black bg-white p-2 shadow-manga hover:shadow-manga-hover transition-all">
                    <img src={item.url} alt="Official Gallery" className="w-full h-auto object-cover" />
                    {item.description && (
                      <div className="mt-2 text-sm font-bold text-gray-700">
                        {item.description}
                      </div>
                    )}
                </div>
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <ZoomIn className="text-white drop-shadow-md w-12 h-12" />
                </div>
            </div>
        ))}
      </div>

      {/* Lightbox Modal */}
      {selectedImage && (
          <div className="fixed inset-0 bg-black bg-opacity-95 z-50 flex items-center justify-center p-4 backdrop-blur-md" onClick={() => setSelectedImage(null)}>
              <button className="absolute top-4 right-4 text-white hover:text-torami-red">
                  <X size={32} />
              </button>
              <div className="max-w-6xl max-h-screen relative" onClick={(e) => e.stopPropagation()}>
                  <img src={selectedImage.url} alt="Full size" className="max-w-full max-h-[85vh] border-4 border-white shadow-2xl" />
                  {selectedImage.description && (
                    <div className="bg-white p-4 mt-2 border-2 border-black shadow-manga">
                      <p className="font-bold text-lg">{selectedImage.description}</p>
                    </div>
                  )}
              </div>
          </div>
      )}
    </div>
  );
};
