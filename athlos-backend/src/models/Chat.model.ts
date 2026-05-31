import db from '../config/db';

export type ChatSender = 'user' | 'athlos';

export interface ChatMessage {
  sender: ChatSender;
  text: string;
  timestamp: string;
}

export interface UserProfile {
  idusuario?: number;
  nombre?: string;
  email?: string;
  peso?: number | string | null;
  talla?: number | string | null;
  edad?: number | null;
  entorno?: string | null;
}

export interface ExerciseCatalogItem {
  idejercicio: number;
  nombre: string;
  descripcion?: string | null;
}

export const getUserProfileById = async (userId: string): Promise<UserProfile> => {
  const result = await db.query(
    `
      SELECT
        u.idusuario,
        u.nombre,
        u.email,
        u.peso,
        u.talla,
        u.edad,
        e.nombre AS entorno
      FROM usuario u
      LEFT JOIN entorno e ON e.identorno = u.identorno
      WHERE u.idusuario::text = $1
      LIMIT 1
    `,
    [userId]
  );

  return result.rows[0] || {};
};

export const getExerciseCatalog = async (): Promise<ExerciseCatalogItem[]> => {
  const result = await db.query(
    `
      SELECT idejercicio, nombre, descripcion
      FROM ejercicio
      ORDER BY idejercicio ASC
    `
  );

  return result.rows;
};

export const getChatHistoryByUserId = async (_userId: string): Promise<ChatMessage[]> => {
  return [];
};

export const saveChatHistoryByUserId = async (
  userId: string,
  mensajes: ChatMessage[]
): Promise<{ userId: string; mensajes: ChatMessage[] }> => {
  return { userId, mensajes };
};

export const clearChatHistoryByUserId = async (
  userId: string
): Promise<{ userId: string; mensajes: ChatMessage[] }> => {
  return { userId, mensajes: [] };
};