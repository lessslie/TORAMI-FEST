import React from 'react';
import { SectionTitle, MangaCard } from '../components/UI';
import { Mail, MessageCircle, Users, Sparkles, Store, Palette, Send } from 'lucide-react';

export const Contact = () => {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8 md:py-12">
      <SectionTitle>Contacto</SectionTitle>

      {/* Desktop: Layout de dos columnas / Mobile: Una columna */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">

        {/* Columna izquierda - Información */}
        <MangaCard className="p-6 md:p-8 bg-white">
          <div className="space-y-6">
            {/* Intro */}
            <div className="flex items-start gap-4">
              <div className="bg-torami-red/10 p-3 rounded-lg flex-shrink-0">
                <MessageCircle className="w-8 h-8 text-torami-red" />
              </div>
              <div>
                <h3 className="font-display text-xl uppercase mb-2 text-gray-800">
                  Estamos para ayudarte
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  Este espacio está destinado a responder todas tus dudas, consultas y sugerencias relacionadas con el evento.
                </p>
              </div>
            </div>

            {/* Quiénes pueden contactar */}
            <div className="bg-gray-50 rounded-lg p-5 border-l-4 border-torami-red">
              <h4 className="font-display text-lg uppercase mb-4 text-gray-800">
                ¿Quiénes pueden escribirnos?
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-torami-red flex-shrink-0" />
                  <span className="text-gray-700">Cosplayers</span>
                </div>
                <div className="flex items-center gap-2">
                  <Store className="w-5 h-5 text-torami-red flex-shrink-0" />
                  <span className="text-gray-700">Expositores</span>
                </div>
                <div className="flex items-center gap-2">
                  <Palette className="w-5 h-5 text-torami-red flex-shrink-0" />
                  <span className="text-gray-700">Artistas</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-torami-red flex-shrink-0" />
                  <span className="text-gray-700">Marcas y sponsors</span>
                </div>
              </div>
              <p className="mt-4 text-gray-600 text-sm">
                O simplemente si querés más información sobre Torami Fest, podés comunicarte con nosotros sin problema.
              </p>
            </div>

            {/* Mensaje motivacional - solo visible en desktop */}
            <div className="hidden lg:block text-center pt-4">
              <p className="text-gray-500 italic text-sm">
                Tu mensaje es importante para seguir mejorando y brindarte la mejor experiencia posible.
              </p>
            </div>
          </div>
        </MangaCard>

        {/* Columna derecha - Contacto */}
        <MangaCard className="p-6 md:p-8 bg-gradient-to-br from-torami-red to-red-700 text-white">
          <div className="h-full flex flex-col justify-center">
            <div className="text-center space-y-6">
              <div className="bg-white/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto">
                <Send className="w-10 h-10" />
              </div>

              <div>
                <h3 className="font-display text-2xl md:text-3xl uppercase mb-2">
                  Escribinos
                </h3>
                <p className="text-white/80 text-sm md:text-base">
                  Nuestro equipo te responderá a la brevedad
                </p>
              </div>

              <a
                href="mailto:toramifest@gmail.com"
                className="inline-flex items-center gap-3 bg-white text-torami-red px-6 py-4 rounded-lg hover:bg-gray-100 transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)] hover:translate-x-[2px] hover:translate-y-[2px] font-bold"
              >
                <Mail className="w-6 h-6" />
                <span className="text-lg md:text-xl">toramifest@gmail.com</span>
              </a>

              <p className="text-white/70 text-xs md:text-sm">
                Hacé click para abrir tu app de correo
              </p>
            </div>
          </div>
        </MangaCard>
      </div>

      {/* Mensaje final - solo visible en mobile */}
      <div className="lg:hidden mt-6 text-center">
        <p className="text-gray-500 italic text-sm">
          Tu mensaje es importante para seguir mejorando y brindarte la mejor experiencia posible.
        </p>
      </div>
    </div>
  );
};
