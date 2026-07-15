import { Request, Response } from 'express';
import {
  deletePlansByUserId,
  GeminiQuotaError,
  generateTrainingPlan,
  getPlanByIdForUser,
  getPlansByUserId,
  createManualPlan,
  ManualRoutineInput,
} from '../services/plan.service';

export const getPlans = async (req: Request, res: Response) => {
  try {
    const plans = await getPlansByUserId(req.user.id);
    return res.status(200).json({ success: true, data: { plans } });
  } catch (error) {
    console.error('Error obteniendo planes:', error);
    return res.status(500).json({ success: false, message: 'No se pudieron obtener los planes.' });
  }
};

export const getPlan = async (req: Request, res: Response) => {
  try {
    const planId = Number(req.params.id);
    if (!Number.isInteger(planId) || planId <= 0) {
      return res.status(400).json({ success: false, message: 'ID de plan inválido.' });
    }
    const plan = await getPlanByIdForUser(planId, req.user.id);
    if (!plan) return res.status(404).json({ success: false, message: 'Plan no encontrado.' });
    return res.status(200).json({ success: true, data: { plan } });
  } catch (error) {
    console.error('Error obteniendo plan:', error);
    return res.status(500).json({ success: false, message: 'No se pudo obtener el plan.' });
  }
};

export const deletePlans = async (req: Request, res: Response) => {
  try {
    const rawPlanIds = req.body?.planIds;
    if (!Array.isArray(rawPlanIds)) {
      return res.status(400).json({ success: false, message: 'Debes seleccionar al menos un plan.' });
    }

    const planIds = [...new Set(rawPlanIds.map(Number))];
    if (
      planIds.length === 0 ||
      planIds.length > 50 ||
      planIds.some((planId) => !Number.isInteger(planId) || planId <= 0)
    ) {
      return res.status(400).json({ success: false, message: 'La selección de planes no es válida.' });
    }

    const deletedPlanIds = await deletePlansByUserId(planIds, req.user.id);
    return res.status(200).json({ success: true, data: { deletedPlanIds } });
  } catch (error) {
    if (error instanceof Error && error.message === 'PLAN_NOT_FOUND') {
      return res.status(404).json({ success: false, message: 'Uno de los planes no existe o no te pertenece.' });
    }
    console.error('Error eliminando planes:', error);
    return res.status(500).json({ success: false, message: 'No se pudieron eliminar los planes.' });
  }
};

export const generatePlan = async (req: Request, res: Response) => {
  try {

    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado. Token JWT requerido.',
      });
    }

    const diasValidos = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    const diasEntrenamiento = req.body?.diasEntrenamiento;
    if (
      !Array.isArray(diasEntrenamiento) ||
      diasEntrenamiento.length === 0 ||
      diasEntrenamiento.length > 7 ||
      new Set(diasEntrenamiento).size !== diasEntrenamiento.length ||
      diasEntrenamiento.some((dia) => !diasValidos.includes(dia))
    ) {
      return res.status(400).json({
        success: false,
        message: 'Selecciona al menos un día válido para entrenar.',
      });
    }

    const diasOrdenados = diasValidos.filter((dia) => diasEntrenamiento.includes(dia));

    console.log(`[Plan Controller] userId extraido del JWT: ${userId}`);

  
    const savedPlan = await generateTrainingPlan(String(userId), diasOrdenados);

    // Devuelve el plan con los IDs generados por la BD (idplan, idrutina)
    return res.status(201).json({ success: true, data: { plan: savedPlan } });
  } catch (error) {
    console.error("--- ERROR CRÍTICO EN GENERATE PLAN ---");
    console.error(error); 
    if (error instanceof GeminiQuotaError) {
      return res.status(429).json({
        success: false,
        code: 'GEMINI_QUOTA_EXCEEDED',
        message: 'Gemini alcanzó su límite gratuito. Podrás intentarlo nuevamente en unos momentos.',
        retryAfterSeconds: error.retryAfterSeconds,
      });
    }
    return res.status(500).json({
      success: false,
      message: 'No se pudo generar el plan. Intenta nuevamente más tarde.'
    });
  }
};

export const createManual = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Usuario no autenticado.' });
    }

    const { nombreplan, rutinas } = req.body;
    if (!nombreplan || !nombreplan.trim()) {
      return res.status(400).json({ success: false, message: 'El nombre del plan es requerido.' });
    }

    if (!Array.isArray(rutinas) || rutinas.length === 0) {
      return res.status(400).json({ success: false, message: 'El plan debe contener al menos una rutina.' });
    }

    // Validar estructura de las rutinas y ejercicios
    for (const r of rutinas) {
      if (!r.nombre || !r.nombre.trim() || typeof r.duracion !== 'number' || r.duracion <= 0) {
        return res.status(400).json({ success: false, message: 'Estructura de rutina inválida. Asegúrate de poner nombre y duración mayor a 0.' });
      }

      if (!Array.isArray(r.ejercicios) || r.ejercicios.length === 0) {
        return res.status(400).json({ success: false, message: `La rutina "${r.nombre}" debe tener al menos un ejercicio.` });
      }

      for (const ex of r.ejercicios) {
        if (typeof ex.idejercicio !== 'number' || typeof ex.series !== 'number' || typeof ex.repeticiones !== 'number') {
          return res.status(400).json({ success: false, message: 'Estructura de ejercicio inválida.' });
        }
        if (ex.series <= 0 || ex.repeticiones <= 0) {
          return res.status(400).json({ success: false, message: 'Las series y repeticiones deben ser mayores a 0.' });
        }
      }
    }

    const savedPlan = await createManualPlan(userId, nombreplan, rutinas as ManualRoutineInput[]);
    return res.status(201).json({ success: true, data: { plan: savedPlan } });
  } catch (error) {
    console.error('Error al crear plan manualmente:', error);
    return res.status(500).json({ success: false, message: 'No se pudo crear el plan. Intenta nuevamente.' });
  }
};
