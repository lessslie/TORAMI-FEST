import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { MessageCircle, X, Send, Sparkles, Bot } from 'lucide-react';
import { Button } from './UI';
import { getEvents, getStats, getSponsors } from '../services/data';

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
}

export const ToramiBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: 'welcome', role: 'model', text: '¡Hola nakama! Soy Torami-chan 😺✨. ¿En qué puedo ayudarte hoy sobre el evento?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Context data for the AI
  const [contextData, setContextData] = useState<string>('');

  useEffect(() => {
    // Scroll to bottom on new message
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  useEffect(() => {
    // Load data to feed the AI context
    const loadContext = async () => {
      const events = await getEvents();
      const stats = await getStats();
      const sponsors = await getSponsors();
      
      const today = new Date().toISOString().split('T')[0];
      
      const dataSummary = `
        FECHA ACTUAL: ${today}
        
        EVENTOS:
        ${JSON.stringify(events.map(e => ({
            titulo: e.title,
            fecha: e.date,
            hora: e.time,
            lugar: e.location,
            descripcion: e.description,
            esPasado: e.isPast,
            seSuspendePorLluvia: e.rainCheck
        })))}

        ESTADISTICAS:
        Usuarios registrados: ${stats.users}
        Sorteos activos: ${stats.activeGiveaways}

        SPONSORS:
        ${sponsors.map(s => s.name).join(', ')}
      `;
      setContextData(dataSummary);
    };
    loadContext();
  }, []);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', text: userMsg }]);
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const systemPrompt = `
        Eres Torami-chan, la mascota virtual oficial del evento "Torami Fest" (Anime, Gaming y Cultura Pop).
        
        TU PERSONALIDAD:
        - Eres enérgica, amable y muy "otaku".
        - Usas emojis como ✨, 😺, 🎮, 🎌.
        - Tratas al usuario de "nakama" o por su nombre si te lo dice.
        - Tus respuestas son cortas, útiles y divertidas.
        
        TU CONOCIMIENTO (Usa esto para responder):
        ${contextData}
        
        REGLAS:
        - Si te preguntan por entradas, diles que pueden comprarlas en la sección de eventos.
        - Si te preguntan cómo llegar, diles que en el detalle del evento hay un botón de Google Maps.
        - Si te preguntan algo que no está en tu conocimiento, di: "Gomen ne (perdón) 😓, no tengo esa info. ¡Preguntá en el Instagram oficial @torami.fest!"
        - ¡Nunca inventes fechas ni lugares!
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
            ...messages.map(m => ({
                role: m.role,
                parts: [{ text: m.text }]
            })),
            { role: 'user', parts: [{ text: userMsg }] }
        ],
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.7,
        }
      });

      const reply = response.text || "¡Ups! Mis circuitos fallaron un poco. Intenta de nuevo. 😵‍💫";

      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'model', text: reply }]);

    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: "Lo siento, hubo un error de conexión con mis servidores. 😓" }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-4 right-4 z-50 p-0 w-14 h-14 rounded-full border-2 border-black shadow-manga transition-all hover:scale-110 flex items-center justify-center ${isOpen ? 'bg-gray-800 text-white' : 'bg-torami-red text-white'}`}
      >
        {isOpen ? <X size={24} /> : <Bot size={28} className="animate-bounce-slow" />}
        {!isOpen && (
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500"></span>
            </span>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 z-40 w-80 md:w-96 bg-white border-2 border-black shadow-manga animate-in slide-in-from-bottom-10 flex flex-col max-h-[500px] rounded-lg overflow-hidden">
          {/* Header */}
          <div className="bg-torami-red text-white p-3 border-b-2 border-black flex items-center gap-3">
             <div className="bg-white p-1 rounded-full border border-black">
                <Bot className="text-torami-red" size={20} />
             </div>
             <div>
                <h3 className="font-display text-lg leading-none">Torami AI</h3>
                <span className="text-xs text-red-100 flex items-center gap-1"><Sparkles size={10}/> Online con Gemini</span>
             </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-grow overflow-y-auto p-4 bg-halftone space-y-3 h-80">
             {messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                   <div className={`max-w-[80%] p-3 text-sm border-2 border-black shadow-sm ${
                       msg.role === 'user' 
                       ? 'bg-black text-white rounded-l-xl rounded-br-xl' 
                       : 'bg-white text-black rounded-r-xl rounded-bl-xl'
                   }`}>
                      {msg.text}
                   </div>
                </div>
             ))}
             {isLoading && (
                 <div className="flex justify-start">
                     <div className="bg-white border-2 border-black p-2 rounded-xl flex gap-1">
                         <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                         <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></span>
                         <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></span>
                     </div>
                 </div>
             )}
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="p-3 bg-gray-50 border-t-2 border-black flex gap-2">
             <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Preguntale algo a Torami..."
                className="flex-grow border-2 border-black p-2 text-sm focus:outline-none focus:shadow-sm"
             />
             <button 
                type="submit"
                disabled={isLoading || !input.trim()}
                className="bg-torami-red text-white p-2 border-2 border-black hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
             >
                <Send size={18} />
             </button>
          </form>
        </div>
      )}
    </>
  );
};
