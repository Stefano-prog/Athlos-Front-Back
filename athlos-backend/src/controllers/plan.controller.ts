import { Request, Response } from 'express';
import { generateTrainingPlan } from '../services/plan.service';

export const generatePlan = async (req: Request, res: Response) => {
  try {
    // req.user.id viene del authMiddleware (JWT payload: { id: number })
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado. Token JWT requerido.',
      });
    }

    console.log(`[Plan Controller] userId extraido del JWT: ${userId}`);

    // Genera el plan con IA (RAG) y lo persiste en la BD transaccionalmente
    const savedPlan = await generateTrainingPlan(String(userId));

    // Devuelve el plan con los IDs generados por la BD (idplan, idrutina)
    return res.status(201).json({ success: true, data: { plan: savedPlan } });
  } catch (error) {
    console.error("--- ERROR CRÍTICO EN GENERATE PLAN ---");
    console.error(error); // Esto expondrá la línea exacta en la consola del backend
    return res.status(500).json({ 
      error: "Internal Server Error", 
      details: error instanceof Error ? error.message : String(error) 
    });
  }
};
