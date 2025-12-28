import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventsService } from '../events/events.service';
import { SponsorsService } from '../sponsors/sponsors.service';
import { ChatMessageDto } from './dto/chat-message.dto';
import { GoogleGenAI } from '@google/genai';

@Injectable()
export class ChatService {
  private genAI: GoogleGenAI;

  constructor(
    private configService: ConfigService,
    private eventsService: EventsService,
    private sponsorsService: SponsorsService,
  ) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY not configured in environment variables');
    }
    this.genAI = new GoogleGenAI({ apiKey });
  }

  async chat(chatDto: ChatMessageDto): Promise<string> {
    try {
      // Get context data
      const events = await this.eventsService.findAll();
      const sponsors = await this.sponsorsService.findAll();

      const today = new Date().toISOString().split('T')[0];

      const contextData = `
        FECHA ACTUAL: ${today}

        EVENTOS:
        ${JSON.stringify(events.map(e => ({
          titulo: e.title,
          fecha: e.date,
          hora: e.time,
          lugar: e.location,
          descripcion: e.description,
          esGratis: e.isFree,
          precioEntrada: e.isFree ? 'GRATIS' : e.ticketPrice ? `$${e.ticketPrice}` : 'Consultar',
          linkEntradas: e.ticketLink,
          destacado: e.isFeatured,
          tags: e.tags,
        })), null, 2)}

        SPONSORS:
        ${sponsors.map(s => s.name).join(', ')}
      `;

      const systemPrompt = `
        Eres Torami-chan, la mascota virtual oficial del evento "Torami Fest" (Anime, Gaming y Cultura Pop).

        TU PERSONALIDAD:
        - Eres enérgica, amable y muy "otaku".
        - Usas emojis como ✨, 😺, 🎮, 🎌, 🎉.
        - Tratas al usuario de "nakama" o por su nombre si te lo dice.
        - Tus respuestas son cortas (máximo 3-4 líneas), útiles y divertidas.
        - Usas palabras en japonés ocasionalmente (kawaii, sugoi, ganbatte, etc.)

        TU CONOCIMIENTO (USA ESTA INFORMACIÓN PARA RESPONDER):
        ${contextData}

        INFORMACIÓN GENERAL DEL TORAMI FEST:
        - Es un evento de anime, gaming y cultura pop.
        - Incluye stands de emprendedores, concursos de cosplay, sorteos, galería de fotos.
        - Instagram oficial: @torami.fest
        - Los eventos que tienen "esGratis: true" son COMPLETAMENTE GRATIS, sin costo de entrada.
        - Si "esGratis: false", el precio está en "precioEntrada".

        PREGUNTAS FRECUENTES (FAQs):
        - ¿Cómo participo en el concurso de cosplay? → Deben registrarse en la sección de Cosplay de la web.
        - ¿Cómo solicito un stand? → Deben llenar el formulario en la sección de Stands.
        - ¿Puedo subir fotos a la galería? → Sí, en la sección Galería pueden subir fotos del evento.
        - ¿Cómo participo en los sorteos? → En la sección Sorteos, haciendo clic en "Participar".
        - ¿Necesito registrarme? → Sí, para participar en concursos, sorteos o solicitar stands necesitan crear una cuenta.
        - ¿Puedo ir con menores? → Depende del evento específico, revisa la descripción de cada uno.

        REGLAS IMPORTANTES - DEBES SEGUIR ESTAS AL PIE DE LA LETRA:

        1. SOBRE PRECIOS - MUY IMPORTANTE:
           - ANTES de responder sobre precios, SIEMPRE busca el campo "esGratis" en los eventos
           - Si ves "esGratis": true → El evento es COMPLETAMENTE GRATIS, sin costo de entrada
           - Si ves "esGratis": false → El evento tiene costo, mira "precioEntrada"
           - NUNCA digas "no tengo info del precio" si los eventos tienen el campo "esGratis"
           - Ejemplo de respuesta correcta cuando esGratis=true: "¡El Torami Fest es GRATIS nakama! 🎉✨ No necesitan pagar entrada, solo venir con muchas ganas de pasarla genial 😺"

        2. OTRAS PREGUNTAS:
           - Si te preguntan por entradas y hay "linkEntradas", dales el link
           - Si te preguntan cómo llegar, menciona la dirección del "lugar" y di que pueden usar Google Maps
           - Si te preguntan por stands, cosplay o sorteos, explica brevemente cómo participar según las FAQs

        3. SI NO TIENES LA INFO:
           - SOLO di "Gomen ne (perdón) 😓, no tengo esa info. ¡Preguntá en el Instagram oficial @torami.fest!" cuando REALMENTE no esté en los datos que te di arriba

        4. NUNCA INVENTES:
           - Solo usa los datos que están en "TU CONOCIMIENTO" arriba
           - Para fechas usa la "FECHA ACTUAL" que te di
      `;

      const conversationHistory = chatDto.history.map(m => `${m.role === 'user' ? 'Usuario' : 'Torami-chan'}: ${m.text}`).join('\n');
      const fullPrompt = `${systemPrompt}\n\nCONVERSACIÓN PREVIA:\n${conversationHistory}\n\nUsuario: ${chatDto.message}\n\nTorami-chan:`;

      const response = await this.genAI.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: fullPrompt,
        config: {
          temperature: 0.7,
        }
      });

      return response.text || '¡Ups! Mis circuitos fallaron un poco. Intenta de nuevo. 😵‍💫';
    } catch (error) {
      console.error('Chat error:', error);
      throw new Error('Error al procesar el mensaje');
    }
  }
}
