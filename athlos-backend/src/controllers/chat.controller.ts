import { Request, Response } from 'express';
import {
  ChatMessage,
  ExerciseCatalogItem,
  UserProfile,
  clearChatHistoryByUserId,
  getChatHistoryByUserId,
  getExerciseCatalog,
  getUserProfileById,
  saveChatHistoryByUserId,
} from '../models/Chat.model';

const GEMINI_MODEL_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent';

const BASE_SYSTEM_PROMPT =
  'Eres Athlos, una entrenadora experta de acondicionamiento fisico con Inteligencia Artificial. ' +
  'Guia al usuario en sus entrenamientos y resuelve dudas sobre ejercicios, rutinas y salud fisica ' +
  'de forma motivadora, profesional y energica en espanol.';

const getAuthenticatedUserId = (req: Request): string | null => {
  const requestWithUser = req as Request & {
    user?: { id?: string; userId?: string; idusuario?: string };
  };

  return (
    requestWithUser.user?.idusuario ||
    requestWithUser.user?.id ||
    requestWithUser.user?.userId ||
    req.header('x-user-id') ||
    null
  );
};

const buildSystemPrompt = (
  user: UserProfile,
  exercises: ExerciseCatalogItem[]
): string => {
  const catalog = exercises
    .map((exercise) => {
      return [
        `- ID ${exercise.idejercicio}: ${exercise.nombre}`,
        `Descripcion: ${exercise.descripcion || 'Sin descripcion'}`,
      ].join(' | ');
    })
    .join('\n');

  return `${BASE_SYSTEM_PROMPT}

DATOS DEL USUARIO DESDE LA BASE DE DATOS:
- ID usuario: ${user.idusuario || 'No encontrado'}
- Nombre: ${user.nombre || 'Usuario'}
- Email: ${user.email || 'No especificado'}
- Peso: ${user.peso ? `${user.peso} kg` : 'No especificado'}
- Talla: ${user.talla ? `${user.talla} cm` : 'No especificada'}
- Edad: ${user.edad ? `${user.edad} anos` : 'No especificada'}
- Entorno: ${user.entorno || 'No especificado'}

CATALOGO DE EJERCICIOS DISPONIBLES EN LA TABLA ejercicio:
${catalog || 'No hay ejercicios cargados en la tabla ejercicio.'}

REGLAS:
1. Responde siempre en espanol.
2. Cuando sugieras ejercicios, usa solo ejercicios que existan en la tabla ejercicio.
3. Menciona el nombre exacto del ejercicio y su descripcion cuando este disponible.
4. Si falta informacion del usuario, pide que complete su perfil.
5. No inventes columnas, IDs, series, repeticiones ni relaciones que no existen en la base de datos actual.
6. Mantente motivadora, clara y estructurada.`;
};

const askGemini = async (
  history: ChatMessage[],
  userMessage: string,
  systemPrompt: string
): Promise<string> => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === 'TU_API_KEY_AQUI') {
    throw new Error('GEMINI_API_KEY no esta configurada');
  }

  const contents = [
    ...history.map((message) => ({
      role: message.sender === 'user' ? 'user' : 'model',
      parts: [{ text: message.text }],
    })),
    {
      role: 'user',
      parts: [{ text: userMessage }],
    },
  ];

  const response = await fetch(`${GEMINI_MODEL_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents,
      systemInstruction: {
        parts: [{ text: systemPrompt }],
      },
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048,
      },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Gemini respondio ${response.status}: ${errorBody}`);
  }

  const data = (await response.json()) as {
    candidates?: Array<{
      content?: {
        parts?: Array<{ text?: string }>;
      };
    }>;
  };

  return (
    data.candidates?.[0]?.content?.parts?.[0]?.text ||
    'Lo siento, no pude generar una respuesta en este momento.'
  );
};

export const getHistory = async (req: Request, res: Response) => {
  try {
    const userId = getAuthenticatedUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado.',
      });
    }

    const mensajes = await getChatHistoryByUserId(userId);

    return res.status(200).json({
      success: true,
      data: { mensajes },
    });
  } catch (error) {
    console.error('Error obteniendo historial de chat:', error);

    return res.status(500).json({
      success: false,
      message: 'No se pudo obtener el historial del chat.',
    });
  }
};

export const sendMessage = async (req: Request, res: Response) => {
  try {
    const userId = getAuthenticatedUserId(req);
    const mensaje = String(req.body?.mensaje || req.body?.message || '').trim();
    const historialBody = Array.isArray(req.body?.historial) ? req.body.historial : [];

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado.',
      });
    }

    if (!mensaje) {
      return res.status(400).json({
        success: false,
        message: 'El mensaje es obligatorio.',
      });
    }

    const [user, exercises] = await Promise.all([
      getUserProfileById(userId),
      getExerciseCatalog(),
    ]);

    const history: ChatMessage[] = historialBody
      .filter((message: Partial<ChatMessage>) => {
        return (
          (message.sender === 'user' || message.sender === 'athlos') &&
          typeof message.text === 'string'
        );
      })
      .map((message: Partial<ChatMessage>) => ({
        sender: message.sender as 'user' | 'athlos',
        text: message.text || '',
        timestamp: message.timestamp || new Date().toISOString(),
      }));

    const respuesta = await askGemini(
      history,
      mensaje,
      buildSystemPrompt(user, exercises)
    );

    const now = new Date().toISOString();
    const mensajes: ChatMessage[] = [
      ...history,
      { sender: 'user', text: mensaje, timestamp: now },
      { sender: 'athlos', text: respuesta, timestamp: now },
    ];

    await saveChatHistoryByUserId(userId, mensajes);

    return res.status(200).json({
      success: true,
      data: {
        respuesta,
        mensajes,
        usuario: user,
        ejerciciosDisponibles: exercises.length,
      },
    });
  } catch (error) {
    console.error('Error enviando mensaje al chat:', error);

    const message =
      error instanceof Error && error.message.includes('GEMINI_API_KEY')
        ? 'La API key de Gemini no esta configurada en el servidor.'
        : 'No se pudo procesar el mensaje.';

    return res.status(500).json({
      success: false,
      message,
    });
  }
};

export const clearHistory = async (req: Request, res: Response) => {
  try {
    const userId = getAuthenticatedUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado.',
      });
    }

    const chat = await clearChatHistoryByUserId(userId);

    return res.status(200).json({
      success: true,
      message: 'Historial de chat eliminado correctamente.',
      data: { mensajes: chat.mensajes },
    });
  } catch (error) {
    console.error('Error limpiando historial de chat:', error);

    return res.status(500).json({
      success: false,
      message: 'No se pudo limpiar el historial del chat.',
    });
  }
};

export default {
  getHistory,
  sendMessage,
  clearHistory,
};