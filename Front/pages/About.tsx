import React from 'react';
import { Heart, Users, Sparkles, Target, Star, Zap, Gamepad2 } from 'lucide-react';

export const About = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-white">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-black via-gray-900 to-black text-white py-20 px-4 text-center border-b-8 border-torami-red relative overflow-hidden">
        {/* Decorative elements */}
        <Gamepad2 className="absolute top-4 left-4 w-16 h-16 text-torami-red opacity-20 animate-bounce" />
        <Zap className="absolute bottom-4 right-4 w-16 h-16 text-yellow-500 opacity-20 animate-pulse" />

        <div className="relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="flex items-center justify-center gap-4 mb-6">
            <Heart className="text-torami-red fill-current animate-pulse" size={56} />
            <h1 className="text-6xl md:text-7xl font-black tracking-tight">
              Sobre Nosotros
            </h1>
            <Heart className="text-torami-red fill-current animate-pulse" size={56} />
          </div>
          <p className="text-2xl text-gray-300 max-w-2xl mx-auto font-medium">
            La historia detrás de Torami Fest
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-16 space-y-16">
        {/* Intro Section */}
        <div className="bg-white border-4 border-black p-10 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(215,0,0,1)] transition-all duration-300 transform hover:-translate-y-1">
          <div className="space-y-6 text-lg leading-relaxed">
            <p className="animate-in fade-in slide-in-from-left duration-500">
              Somos <span className="font-black text-torami-red text-3xl inline-block hover:scale-110 transition-transform">Torami Fest</span>, un evento creado desde la pasión por el animé, el manga, los videojuegos y la cultura geek. Nacimos con una idea clara: construir un espacio donde los fans puedan encontrarse, expresarse y disfrutar de lo que aman, sin importar la edad ni la experiencia dentro del fandom.
            </p>

            <p className="animate-in fade-in slide-in-from-right duration-500 delay-150">
              Detrás de Torami Fest hay personas reales, comprometidas y con ganas de hacer las cosas bien. Cada edición es pensada con dedicación, cuidando cada detalle para que el público viva una experiencia auténtica, divertida y segura. No buscamos copiar fórmulas, <span className="font-bold text-torami-red">buscamos crear momentos</span>.
            </p>
          </div>
        </div>

        {/* Values Grid */}
        <div>
          <h2 className="text-4xl font-black text-center mb-10 flex items-center justify-center gap-3">
            <Sparkles className="text-yellow-500" size={40} />
            Nuestros Valores
            <Sparkles className="text-yellow-500" size={40} />
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            {/* Comunidad */}
            <div className="group bg-gradient-to-br from-red-50 to-white border-4 border-black p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[10px_10px_0px_0px_rgba(215,0,0,1)] hover:-translate-x-1 hover:-translate-y-1 transition-all duration-300">
              <div className="flex items-center gap-4 mb-4">
                <div className="bg-torami-red text-white p-4 rounded-xl group-hover:scale-110 transition-transform shadow-lg">
                  <Users size={36} />
                </div>
                <h3 className="text-3xl font-black">Comunidad</h3>
              </div>
              <p className="text-gray-800 text-lg leading-relaxed">
                Un lugar donde artistas, emprendedores y asistentes comparten el mismo entusiasmo y hacen que todo cobre sentido.
              </p>
            </div>

            {/* Creatividad */}
            <div className="group bg-gradient-to-br from-yellow-50 to-white border-4 border-black p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[10px_10px_0px_0px_rgba(234,179,8,1)] hover:-translate-x-1 hover:-translate-y-1 transition-all duration-300">
              <div className="flex items-center gap-4 mb-4">
                <div className="bg-yellow-500 text-white p-4 rounded-xl group-hover:scale-110 transition-transform shadow-lg">
                  <Sparkles size={36} />
                </div>
                <h3 className="text-3xl font-black">Creatividad</h3>
              </div>
              <p className="text-gray-800 text-lg leading-relaxed">
                Respeto y creatividad son pilares fundamentales. Cada expresión artística y cada cosplay tienen un lugar especial.
              </p>
            </div>

            {/* Respeto */}
            <div className="group bg-gradient-to-br from-blue-50 to-white border-4 border-black p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[10px_10px_0px_0px_rgba(59,130,246,1)] hover:-translate-x-1 hover:-translate-y-1 transition-all duration-300">
              <div className="flex items-center gap-4 mb-4">
                <div className="bg-blue-500 text-white p-4 rounded-xl group-hover:scale-110 transition-transform shadow-lg">
                  <Heart size={36} className="fill-current" />
                </div>
                <h3 className="text-3xl font-black">Respeto</h3>
              </div>
              <p className="text-gray-800 text-lg leading-relaxed">
                Un ambiente seguro e inclusivo donde todos pueden ser ellos mismos sin prejuicios ni discriminación.
              </p>
            </div>

            {/* Encuentro */}
            <div className="group bg-gradient-to-br from-green-50 to-white border-4 border-black p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[10px_10px_0px_0px_rgba(34,197,94,1)] hover:-translate-x-1 hover:-translate-y-1 transition-all duration-300">
              <div className="flex items-center gap-4 mb-4">
                <div className="bg-green-500 text-white p-4 rounded-xl group-hover:scale-110 transition-transform shadow-lg">
                  <Target size={36} />
                </div>
                <h3 className="text-3xl font-black">Encuentro</h3>
              </div>
              <p className="text-gray-800 text-lg leading-relaxed">
                Creamos espacios donde la comunidad geek se reúne, conecta y comparte experiencias inolvidables.
              </p>
            </div>
          </div>
        </div>

        {/* Final Message */}
        <div className="bg-gradient-to-br from-black via-gray-900 to-black text-white p-16 text-center relative overflow-hidden border-8 border-torami-red shadow-[12px_12px_0px_0px_rgba(215,0,0,1)]">
          <div className="absolute inset-0 opacity-10">
            <Star className="absolute top-10 left-10 w-24 h-24 animate-pulse text-yellow-500" />
            <Star className="absolute bottom-10 right-10 w-24 h-24 animate-pulse text-yellow-500" />
            <Star className="absolute top-1/2 right-20 w-16 h-16 animate-bounce text-pink-500" />
            <Star className="absolute top-20 right-1/2 w-16 h-16 animate-bounce text-blue-500" />
            <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 text-torami-red" />
          </div>

          <div className="relative z-10">
            <h2 className="text-5xl md:text-6xl font-black mb-10 leading-tight">
              Torami Fest es más que un evento
            </h2>
            <div className="text-3xl md:text-4xl leading-relaxed mb-10 space-y-4">
              <p>
                es <span className="text-yellow-400 font-black inline-block hover:scale-125 transition-transform">comunidad</span>,
                es <span className="text-blue-400 font-black inline-block hover:scale-125 transition-transform">respeto</span>,
                es <span className="text-pink-400 font-black inline-block hover:scale-125 transition-transform">creatividad</span> y
                es <span className="text-green-400 font-black inline-block hover:scale-125 transition-transform">encuentro</span>.
              </p>
            </div>
            <div className="border-t-4 border-torami-red pt-8 mt-8">
              <p className="text-xl md:text-2xl text-gray-300 mb-10 max-w-4xl mx-auto leading-relaxed">
                Seguimos creciendo paso a paso, aprendiendo y mejorando en cada edición, con un solo objetivo: que quienes nos visiten se vayan con una sonrisa y ganas de volver.
              </p>
              <div className="inline-block bg-torami-red text-white px-8 py-4 text-4xl font-black transform -rotate-2 shadow-lg hover:rotate-0 hover:scale-110 transition-all">
                ¡Bienvenidos a Torami Fest!
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
