import React, { useEffect, useState } from 'react';
import { SectionTitle, MangaCard, Button, Badge } from '../components/UI';
import { getGallery, getEvents, addGalleryItem } from '../services/data';
import { Event, GalleryItem } from '../types';
import { useAuth } from '../App';
import { Image, Camera, X, Upload, Filter, Heart, ZoomIn, CheckCircle, Sparkles, ShieldCheck } from 'lucide-react';

export const Gallery = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [filterEvent, setFilterEvent] = useState<string>('all');
  
  // Upload Modal State
  const [showUpload, setShowUpload] = useState(false);
  const [uploadData, setUploadData] = useState({ eventId: '', description: '', url: '' });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Lightbox State
  const [selectedImage, setSelectedImage] = useState<GalleryItem | null>(null);

  useEffect(() => {
    getGallery().then(data => setItems(data.filter(i => i.approved || (user && i.userId === user.id)))); // Show approved or OWN pending/rejected
    getEvents().then(setEvents);
  }, [user]); // Re-fetch if user status changes

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadData(prev => ({ ...prev, url: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadData.url || !uploadData.eventId) return;

    await addGalleryItem({
        eventId: uploadData.eventId,
        description: uploadData.description,
        url: uploadData.url,
        userId: user?.id
    });
    
    setIsSuccess(true);
    setTimeout(() => {
        setIsSuccess(false);
        setShowUpload(false);
        setUploadData({ eventId: '', description: '', url: '' });
        setSelectedFile(null);
        getGallery().then(data => setItems(data.filter(i => i.approved || (user && i.userId === user.id)))); // Refresh list
    }, 2000);
  };

  const filteredItems = filterEvent === 'all' 
    ? items 
    : items.filter(i => i.eventId === filterEvent);

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <SectionTitle>
           <span className="flex items-center gap-2">
             <Camera className="text-torami-red transform rotate-12" /> Galería
           </span>
        </SectionTitle>
        
        {user && (
            <Button onClick={() => setShowUpload(true)} className="flex items-center gap-2 animate-bounce-slow">
                <Upload size={18} /> Subir Foto
            </Button>
        )}
      </div>

      {/* Fun CTA for non-logged users */}
      {!user && (
        <div className="mb-8 transform hover:scale-[1.01] transition-transform duration-300">
           <MangaCard className="bg-yellow-50 border-torami-red relative overflow-hidden">
               <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left relative z-10">
                   <div className="bg-white p-4 rounded-full border-2 border-black transform -rotate-12 shrink-0 shadow-sm">
                       <Camera size={40} className="text-torami-red" />
                   </div>
                   <div>
                       <h3 className="font-display text-2xl uppercase italic tracking-wider mb-1 text-black">
                           ¿Querés que tus fotos aparezcan aquí?
                       </h3>
                       <p className="font-bold text-gray-800 text-lg">
                           ¡Registrate en Torami Fest y subilas para compartirlas con la comunidad!
                       </p>
                       <p className="text-sm text-gray-600 mt-2 italic flex items-center justify-center md:justify-start gap-1 font-bold bg-white/50 inline-block px-2 rounded">
                          <ShieldCheck size={16} className="text-blue-600"/> (Previa verificación claro, jijiji 🤭)
                       </p>
                   </div>
               </div>
               {/* Decorative Sparkles */}
               <Sparkles className="absolute -right-6 -bottom-6 text-yellow-400 w-32 h-32 opacity-40 rotate-12 pointer-events-none" />
               <Sparkles className="absolute top-4 left-4 text-pink-400 w-6 h-6 opacity-60 animate-pulse pointer-events-none" />
           </MangaCard>
        </div>
      )}

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

      {/* Masonry Grid */}
      <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
        {filteredItems.map(item => (
            <div key={item.id} className="break-inside-avoid relative group cursor-pointer" onClick={() => setSelectedImage(item)}>
                <div className="border-2 border-black bg-white p-1 shadow-manga hover:shadow-manga-hover transition-all">
                    <img src={item.url} alt="Gallery Item" className="w-full h-auto object-cover" />
                </div>
                {!item.approved && (
                    <div className="absolute top-3 right-3 z-10">
                        <Badge color={item.status === 'rejected' ? 'red' : 'yellow'}>
                             {item.status === 'rejected' ? 'Rechazada' : 'En Revisión'}
                        </Badge>
                    </div>
                )}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <ZoomIn className="text-white drop-shadow-md w-10 h-10" />
                </div>
            </div>
        ))}
      </div>

      {/* Upload Modal */}
      {showUpload && (
          <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
              <div className="bg-white border-2 border-black w-full max-w-md shadow-manga relative">
                  <button onClick={() => setShowUpload(false)} className="absolute top-2 right-2 p-1 hover:bg-gray-100 rounded-full">
                      <X size={24} />
                  </button>
                  
                  {isSuccess ? (
                      <div className="p-12 text-center flex flex-col items-center">
                          <CheckCircle className="text-green-500 w-16 h-16 mb-4 animate-bounce" />
                          <h3 className="font-display text-2xl">¡Foto Enviada!</h3>
                          <p className="text-gray-600">Tu foto pasará a moderación antes de ser pública.</p>
                      </div>
                  ) : (
                      <div className="p-6">
                          <h3 className="font-display text-2xl mb-6 flex items-center gap-2">
                              <Upload className="text-torami-red" /> Subir Foto
                          </h3>
                          <form onSubmit={handleUploadSubmit} className="space-y-4">
                              <div>
                                  <label className="block text-sm font-bold mb-1">Evento</label>
                                  <select 
                                    className="w-full border-2 border-black p-2 bg-white"
                                    required
                                    value={uploadData.eventId}
                                    onChange={(e) => setUploadData({...uploadData, eventId: e.target.value})}
                                  >
                                      <option value="">Seleccioná un evento...</option>
                                      {events.map(ev => <option key={ev.id} value={ev.id}>{ev.title}</option>)}
                                  </select>
                              </div>

                              <div>
                                  <label className="block text-sm font-bold mb-1">Tu Foto</label>
                                  <div className="border-2 border-dashed border-gray-400 bg-gray-50 p-4 text-center cursor-pointer hover:bg-gray-100 transition-colors relative">
                                      <input 
                                        type="file" 
                                        accept="image/*" 
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        onChange={handleFileSelect}
                                        required
                                      />
                                      {uploadData.url ? (
                                          <img src={uploadData.url} alt="Preview" className="h-32 mx-auto object-contain shadow-sm" />
                                      ) : (
                                          <div className="text-gray-500 py-4">
                                              <Image className="mx-auto mb-2" />
                                              <span className="text-xs font-bold uppercase">Tocá para elegir archivo</span>
                                          </div>
                                      )}
                                  </div>
                              </div>

                              <div>
                                  <label className="block text-sm font-bold mb-1">Descripción / Comentario</label>
                                  <textarea 
                                    className="w-full border-2 border-black p-2"
                                    rows={2}
                                    placeholder="¿Qué momento es este?"
                                    value={uploadData.description}
                                    onChange={(e) => setUploadData({...uploadData, description: e.target.value})}
                                    required
                                  ></textarea>
                              </div>
                              
                              <Button type="submit" className="w-full">Enviar a Galería</Button>
                          </form>
                      </div>
                  )}
              </div>
          </div>
      )}

      {/* Lightbox Modal */}
      {selectedImage && (
          <div className="fixed inset-0 bg-black bg-opacity-95 z-50 flex items-center justify-center p-4 backdrop-blur-md" onClick={() => setSelectedImage(null)}>
              <button className="absolute top-4 right-4 text-white hover:text-torami-red">
                  <X size={32} />
              </button>
              <div className="max-w-4xl max-h-screen relative" onClick={(e) => e.stopPropagation()}>
                  <img src={selectedImage.url} alt="Full size" className="max-w-full max-h-[85vh] border-4 border-white shadow-2xl" />
                  <div className="bg-white p-4 mt-2 border-2 border-black shadow-manga flex items-center justify-between">
                      <div className="flex flex-col">
                        <p className="font-bold">{selectedImage.description}</p>
                        {selectedImage.feedback && (
                            <p className="text-xs text-red-600 font-bold mt-1 bg-red-50 p-1 border border-red-200 inline-block">
                                Rechazada: {selectedImage.feedback}
                            </p>
                        )}
                      </div>
                      <button className="text-red-500 hover:scale-110 transition-transform"><Heart fill="currentColor" /></button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
