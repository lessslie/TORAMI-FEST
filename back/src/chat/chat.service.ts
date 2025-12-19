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
        })))}

        SPONSORS:
        ${sponsors.map(s => s.name).join(', ')}
      `;

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
