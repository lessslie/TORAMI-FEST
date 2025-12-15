import React, { useState, useRef } from 'react';
import { SectionTitle, MangaCard, Input, Button } from '../components/UI';
import { addStandApplication } from '../services/data';
import { StandApplication } from '../types';
import { Store, Coffee, CheckCircle, Send, ShoppingBag, Upload, X, Image } from 'lucide-react';
import { useAuth } from '../App';

export const StandForm = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    brandName: '',
    type: 'Merch',
    contactName: '',
    email: '',
    phone: '',
    socials: '',
    description: '',
    needs: '',
    otherType: ''
  });
  
  const [images, setImages] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      if (images.length >= 5) {
        setError("Máximo 5 fotos permitidas.");
        return;
      }
      
      const file = e.target.files[0];
      const reader = new FileReader();
      
      reader.onloadend = () => {
        setImages(prev => [...prev, reader.result as string]);
        setError(null);
      };
      
      reader.readAsDataURL(file);
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
    
    // Simulate user ID if not logged in (for demo purposes)
    const userId = user?.id || 'guest_user';

    if (images.length === 0) {
      setError("Debes subir al menos 1 foto de tu mercadería.");
      return;
    }

    const finalType = formData.type === 'Otros' ? formData.otherType : formData.type;
    
    await addStandApplication({
      ...formData,
      userId,
      type: finalType as any,
      images: images
    });
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <MangaCard className="py-12 bg-green-50 border-green-800 flex flex-col items-center">
          <CheckCircle className="text-green-600 w-16 h-16 mb-4" />
          <h2 className="font-display text-3xl mb-4">¡Solicitud Enviada!</h2>
          <p className="mb-6">El equipo de Torami Fest revisará tu propuesta. Te contactaremos pronto.</p>
          <Button onClick={() => { setSubmitted(false); setImages([]); setFormData({ ...formData, brandName: '' }); }}>Enviar otra</Button>
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
                <li>El espacio incluye 1 mesa y 2 sillas.</li>
                <li>Fecha límite para aplicar: 15 días antes del evento.</li>
                <li>No se permite reventa de productos no oficiales sin licencia.</li>
              </ul>
            </div>
          </div>
        </MangaCard>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Input name="brandName" label="Nombre del Stand" required onChange={handleChange} placeholder="Ej. Tienda Kawaii" />
            <Input name="contactName" label="Persona de Contacto" required onChange={handleChange} />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Input name="email" label="Email" type="email" required onChange={handleChange} />
            <Input 
                name="phone" 
                label="Número de WhatsApp (Obligatorio)" 
                required 
                onChange={handleChange} 
                placeholder="Ej. +54 9 11 1234 5678"
            />
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
              className="w-full border-2 border-black p-3 focus:outline-none focus:shadow-manga"
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
                        onClick={() => fileInputRef.current?.click()}
                        className="w-20 h-20 border-2 border-dashed border-gray-400 flex flex-col items-center justify-center text-gray-500 hover:text-torami-red hover:border-torami-red transition-colors bg-gray-50"
                      >
                          <Upload size={20} className="mb-1" />
                          <span className="text-[10px] font-bold">Subir</span>
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
             <div className="p-3 bg-red-100 border border-red-400 text-red-700 text-sm font-bold rounded mb-4">
                 {error}
             </div>
          )}

          <Button type="submit" className="w-full flex items-center justify-center gap-2">
            <Send size={18} /> Enviar Postulación
          </Button>
        </form>
      </div>
    </div>
  );
};
