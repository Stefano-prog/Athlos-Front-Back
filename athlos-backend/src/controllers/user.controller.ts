import { Request, Response } from "express";
import db from "../config/db";
import { updateUserData, updateUserEnvironment } from "../models/User.model";

// GET /api/user/profile
export const getProfile = async (req: Request, res: Response) => {
    try {
        const result = await db.query(
            `SELECT idusuario, nombre, email, peso, talla, edad, puntos, identorno
             FROM usuario WHERE idusuario = $1`,
            [req.user.id]
        );

        if (result.rowCount === 0)
            return res.status(404).json({ 
        success: false, 
        message: "Usuario no encontrado." });

        return res.status(200).json({ 
        success: true, 
        data: result.rows[0] });
    } catch (error) {
        console.error("Error:", error);
        return res.status(500).json({ 
        success: false, 
        message: (error as any).message || "Error interno del servidor." });
    }
};

// PUT /api/user/profile  
export const updateProfile = async (req: Request, res: Response): Promise<void> => {
    try {
        const { nombre, email, peso, talla, edad } = req.body;
        const user = await updateUserData(req.user.id, nombre, email, peso, talla, edad);
        if (!user) {
            res.status(404).json({ success: false, message: 'Usuario no encontrado.' });
            return;
        }
        res.status(200).json({ success: true, data: user });
    } catch (error) {
        console.error('Error en updateProfile', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor.' });
    }
};
// PUT /api/user/environment  
export const updateEnvironment = async (req: Request, res: Response): Promise<void> => {
    try {
        const { identorno } = req.body;
        const user = await updateUserEnvironment(req.user.id, identorno);
        if (!user) {
            res.status(404).json({ success: false, message: 'Usuario no encontrado.' });
            return;
        }
        res.status(200).json({ success: true, data: user });
    } catch (error) {
        console.error('Error en updateEnvironment', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor.' });
    }
};
