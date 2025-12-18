import React from 'react';
import { Heart, Users, Sparkles, Target } from 'lucide-react';
import { SectionTitle, MangaCard } from '../components/UI';

export const About = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <SectionTitle>
        <span className="flex items-center gap-3">
          <Heart className="text-torami-red fill-current" /> Sobre Nosotros
        </span>
      </SectionTitle>

      <div className="space-y-8">
        {/* Intro */}
        <MangaCard className="bg-gradient-to-br from-white to-gray-50">
          <div className="prose prose-lg max-w-none">
            <p className="text-lg leading-relaxed mb-6">
              Somos <span className="font-bold text-torami-red">Torami Fest</span>, un evento creado desde la pasión por el animé, el manga, los videojuegos y la cultura geek. Nacimos con una idea clara: construir un espacio donde los fans puedan encontrarse, expresarse y disfrutar de lo que aman, sin importar la edad ni la experiencia dentro del fandom.
            </p>

            <p className="text-lg leading-relaxed mb-6">
              Detrás de Torami Fest hay personas reales, comprometidas y con ganas de hacer las cosas bien. Cada edición es pensada con dedicación, cuidando cada detalle para que el público viva una experiencia auténtica, divertida y segura. No buscamos copiar fórmulas, buscamos crear momentos.
            </p>
          </div>
        </MangaCard>

        {/* Valores destacados */}
        <div className="grid md:grid-cols-2 gap-6">
          <MangaCard className="border-t-4 border-t-torami-red">
            <div className="flex items-start gap-4">
              <Users className="text-torami-red w-8 h-8 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-display text-xl mb-2">Comunidad</h3>
                <p className="text-gray-700">
                  Un lugar donde artistas, emprendedores y asistentes comparten el mismo entusiasmo y hacen que todo cobre sentido.
                </p>
              </div>
            </div>
          </MangaCard>

          <MangaCard className="border-t-4 border-t-yellow-500">
            <div className="flex items-start gap-4">
              <Sparkles className="text-yellow-500 w-8 h-8 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-display text-xl mb-2">Creatividad</h3>
                <p className="text-gray-700">
                  Respeto y creatividad son pilares fundamentales. Cada expresión artística y cada cosplay tienen un lugar especial.
                </p>
              </div>
            </div>
          </MangaCard>

          <MangaCard className="border-t-4 border-t-blue-500">
            <div className="flex items-start gap-4">
              <Heart className="text-blue-500 w-8 h-8 flex-shrink-0 mt-1 fill-current" />
              <div>
                <h3 className="font-display text-xl mb-2">Respeto</h3>
                <p className="text-gray-700">
                  Un ambiente seguro e inclusivo donde todos pueden ser ellos mismos sin prejuicios ni discriminación.
                </p>
              </div>
            </div>
          </MangaCard>

          <MangaCard className="border-t-4 border-t-green-500">
            <div className="flex items-start gap-4">
              <Target className="text-green-500 w-8 h-8 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-display text-xl mb-2">Encuentro</h3>
                <p className="text-gray-700">
                  Creamos espacios donde la comunidad geek se reúne, conecta y comparte experiencias inolvidables.
                </p>
              </div>
            </div>
          </MangaCard>
        </div>

        {/* Mensaje final */}
        <MangaCard className="bg-black text-white relative overflow-hidden">
          <Sparkles className="absolute -right-10 -bottom-10 text-torami-red w-64 h-64 opacity-10" />
          <div className="relative z-10 text-center py-8">
            <h2 className="font-display text-3xl md:text-4xl mb-6">
              Torami Fest es más que un evento:
            </h2>
            <p className="text-xl md:text-2xl leading-relaxed mb-6">
              es <span className="text-yellow-400 font-bold">comunidad</span>, es <span className="text-blue-400 font-bold">respeto</span>, es <span className="text-pink-400 font-bold">creatividad</span> y es <span className="text-green-400 font-bold">encuentro</span>.
            </p>
            <p className="text-lg text-gray-300 mb-8">
              Seguimos creciendo paso a paso, aprendiendo y mejorando en cada edición, con un solo objetivo: que quienes nos visiten se vayan con una sonrisa y ganas de volver.
            </p>
            <p className="font-display text-2xl text-torami-red">
              Bienvenidos a Torami Fest.
            </p>
          </div>
        </MangaCard>
      </div>
    </div>
  );
};
