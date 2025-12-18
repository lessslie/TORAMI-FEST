import React from 'react';
import { Heart, Users, Sparkles, Target, Star } from 'lucide-react';

export const About = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Header */}
      <div className="bg-black text-white py-16 px-4 text-center border-b-4 border-torami-red">
        <h1 className="text-5xl md:text-6xl font-bold mb-4 flex items-center justify-center gap-4">
          <Heart className="text-torami-red fill-current animate-pulse" size={48} />
          Sobre Nosotros
        </h1>
        <p className="text-xl text-gray-300 max-w-2xl mx-auto">
          La historia detrás de Torami Fest
        </p>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-12 space-y-12">
        {/* Intro Section */}
        <div className="bg-white border-4 border-black p-8 shadow-lg">
          <div className="space-y-6 text-lg leading-relaxed">
            <p>
              Somos <span className="font-black text-torami-red text-2xl">Torami Fest</span>, un evento creado desde la pasión por el animé, el manga, los videojuegos y la cultura geek. Nacimos con una idea clara: construir un espacio donde los fans puedan encontrarse, expresarse y disfrutar de lo que aman, sin importar la edad ni la experiencia dentro del fandom.
            </p>

            <p>
              Detrás de Torami Fest hay personas reales, comprometidas y con ganas de hacer las cosas bien. Cada edición es pensada con dedicación, cuidando cada detalle para que el público viva una experiencia auténtica, divertida y segura. No buscamos copiar fórmulas, buscamos crear momentos.
            </p>
          </div>
        </div>

        {/* Values Grid */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Comunidad */}
          <div className="bg-gradient-to-br from-red-50 to-white border-4 border-black p-6 hover:shadow-2xl transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-torami-red text-white p-3 rounded-lg">
                <Users size={32} />
              </div>
              <h3 className="text-2xl font-black">Comunidad</h3>
            </div>
            <p className="text-gray-700 text-lg">
              Un lugar donde artistas, emprendedores y asistentes comparten el mismo entusiasmo y hacen que todo cobre sentido.
            </p>
          </div>

          {/* Creatividad */}
          <div className="bg-gradient-to-br from-yellow-50 to-white border-4 border-black p-6 hover:shadow-2xl transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-yellow-500 text-white p-3 rounded-lg">
                <Sparkles size={32} />
              </div>
              <h3 className="text-2xl font-black">Creatividad</h3>
            </div>
            <p className="text-gray-700 text-lg">
              Respeto y creatividad son pilares fundamentales. Cada expresión artística y cada cosplay tienen un lugar especial.
            </p>
          </div>

          {/* Respeto */}
          <div className="bg-gradient-to-br from-blue-50 to-white border-4 border-black p-6 hover:shadow-2xl transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-blue-500 text-white p-3 rounded-lg">
                <Heart size={32} className="fill-current" />
              </div>
              <h3 className="text-2xl font-black">Respeto</h3>
            </div>
            <p className="text-gray-700 text-lg">
              Un ambiente seguro e inclusivo donde todos pueden ser ellos mismos sin prejuicios ni discriminación.
            </p>
          </div>

          {/* Encuentro */}
          <div className="bg-gradient-to-br from-green-50 to-white border-4 border-black p-6 hover:shadow-2xl transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-green-500 text-white p-3 rounded-lg">
                <Target size={32} />
              </div>
              <h3 className="text-2xl font-black">Encuentro</h3>
            </div>
            <p className="text-gray-700 text-lg">
              Creamos espacios donde la comunidad geek se reúne, conecta y comparte experiencias inolvidables.
            </p>
          </div>
        </div>

        {/* Final Message */}
        <div className="bg-black text-white p-12 text-center relative overflow-hidden border-4 border-torami-red">
          <div className="absolute inset-0 opacity-5">
            <Star className="absolute top-10 left-10 w-20 h-20 animate-pulse" />
            <Star className="absolute bottom-10 right-10 w-20 h-20 animate-pulse" />
            <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64" />
          </div>

          <div className="relative z-10">
            <h2 className="text-4xl md:text-5xl font-black mb-8">
              Torami Fest es más que un evento
            </h2>
            <p className="text-2xl md:text-3xl leading-relaxed mb-8">
              es <span className="text-yellow-400 font-black">comunidad</span>, es <span className="text-blue-400 font-black">respeto</span>, es <span className="text-pink-400 font-black">creatividad</span> y es <span className="text-green-400 font-black">encuentro</span>.
            </p>
            <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Seguimos creciendo paso a paso, aprendiendo y mejorando en cada edición, con un solo objetivo: que quienes nos visiten se vayan con una sonrisa y ganas de volver.
            </p>
            <p className="text-3xl font-black text-torami-red">
              Bienvenidos a Torami Fest.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
