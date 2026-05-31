import { Request, Response } from "express";
import db from "../config/db";
import {
    hashPassword,
    comparePassword,
    generateToken,
    generateVerificationCode,
} from "../services/auth.service";
import { sendVerificationCode, sendPasswordResetCode } from "../services/email.service";

// Códigos temporales en memoria
const verificationCodes = new Map<string, string>();
const resetCodes = new Map<string, { code: string; expires: number }>();

// POST /api/auth/register  ←  lo llama Registro-Usuario.tsx
export const register = async (req: Request, res: Response) => {
    try {
        const { nombre, email, password } = req.body;

        // Verificar si el correo ya existe
        const existe = await db.query(
            `SELECT idusuario FROM usuario WHERE email = $1`,
            [email]
        );
        if (existe.rowCount && existe.rowCount > 0) {
            return res.status(400).json({ success: false, message: "El correo ya está registrado." });
        }

        // Hashear contraseña y guardar usuario
        const hash = await hashPassword(password);
        const result = await db.query(
            `INSERT INTO usuario (nombre, email, "contraseñahash", puntos)
             VALUES ($1, $2, $3, 0)
             RETURNING idusuario`,
            [nombre, email, hash]
        );

        // Generar código de verificación
        const codigo = generateVerificationCode();
        verificationCodes.set(email, codigo);

    try {
            await sendVerificationCode(email, codigo);
        } catch (emailError) {
            console.error("Error enviando email:", emailError);
            // Si falla el email, continuamos igual y mostramos el código en pantalla
        }

        return res.status(201).json({
            success: true,
            message: "Usuario creado. Revisa tu correo para verificar tu cuenta.",
            codigoSimulado: codigo,
        });
    } catch (error) {
        console.error("Error en register:", error);
        return res.status(500).json({ success: false, message: (error as any).message || "Error interno del servidor." });
    }
};

// POST /api/auth/verify-email  ←  lo llama Registro-Usuario.tsx (paso 2)
export const verifyEmail = async (req: Request, res: Response) => {
    try {
        const { email, codigo } = req.body;

        const codigoEsperado = verificationCodes.get(email);
        if (!codigoEsperado || codigoEsperado !== codigo) {
            return res.status(400).json({ success: false, message: "Código incorrecto." });
        }

        // Obtener el usuario y generar token
        const result = await db.query(
            `SELECT idusuario, nombre, email FROM usuario WHERE email = $1`,
            [email]
        );
        const user = result.rows[0];
        verificationCodes.delete(email);

        const token = generateToken(user.idusuario);

        return res.status(200).json({
            success: true,
            data: { token, user: { id: user.idusuario, nombre: user.nombre, email: user.email } }
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Error interno del servidor." });
    }
};

// POST /api/auth/login  ←  lo llama inicio-sesion.tsx
export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        const result = await db.query(
            `SELECT idusuario, nombre, email, "contraseñahash" FROM usuario WHERE email = $1`,
            [email]
        );

        if (result.rowCount === 0) {
            return res.status(401).json({ success: false, message: "Credenciales incorrectas." });
        }

        const user = result.rows[0];
        const passwordValida = await comparePassword(password, user.contraseñahash);
        if (!passwordValida) {
            return res.status(401).json({ success: false, message: "Credenciales incorrectas." });
        }

        const token = generateToken(user.idusuario);

        return res.status(200).json({
            success: true,
            data: { token, user: { id: user.idusuario, nombre: user.nombre, email: user.email } }
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Error interno del servidor." });
    }
};

// POST /api/auth/forgot-password  ←  paso 1: solicitar código
export const forgotPassword = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ success: false, message: "El correo es requerido." });
        }

        // Verificar que el usuario existe
        const result = await db.query(
            `SELECT idusuario FROM usuario WHERE email = $1`,
            [email]
        );
        if (!result.rowCount || result.rowCount === 0) {
            // Respuesta genérica por seguridad
            return res.status(200).json({ success: true, message: "Si el correo existe, recibirás un código." });
        }

        // Generar código con expiración de 10 minutos
        const codigo = generateVerificationCode();
        resetCodes.set(email, { code: codigo, expires: Date.now() + 10 * 60 * 1000 });

        try {
            await sendPasswordResetCode(email, codigo);
        } catch (emailError) {
            console.error("Error enviando email de recuperación:", emailError);
        }

        return res.status(200).json({
            success: true,
            message: "Código de recuperación enviado a tu correo.",
            codigoSimulado: codigo, // para pruebas, quitar en producción
        });
    } catch (error) {
        console.error("Error en forgotPassword:", error);
        return res.status(500).json({ success: false, message: "Error interno del servidor." });
    }
};

// POST /api/auth/verify-reset-code  ←  paso 2: verificar código
export const verifyResetCode = async (req: Request, res: Response) => {
    try {
        const { email, codigo } = req.body;

        const entry = resetCodes.get(email);
        if (!entry) {
            return res.status(400).json({ success: false, message: "No hay un código activo para este correo." });
        }
        if (Date.now() > entry.expires) {
            resetCodes.delete(email);
            return res.status(400).json({ success: false, message: "El código ha expirado. Solicita uno nuevo." });
        }
        if (entry.code !== codigo) {
            return res.status(400).json({ success: false, message: "Código incorrecto." });
        }

        return res.status(200).json({ success: true, message: "Código válido." });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Error interno del servidor." });
    }
};

// POST /api/auth/reset-password  ←  paso 3: nueva contraseña
export const resetPassword = async (req: Request, res: Response) => {
    try {
        const { email, codigo, nuevaPassword } = req.body;

        const entry = resetCodes.get(email);
        if (!entry) {
            return res.status(400).json({ success: false, message: "No hay un código activo para este correo." });
        }
        if (Date.now() > entry.expires) {
            resetCodes.delete(email);
            return res.status(400).json({ success: false, message: "El código ha expirado. Solicita uno nuevo." });
        }
        if (entry.code !== codigo) {
            return res.status(400).json({ success: false, message: "Código incorrecto." });
        }
        if (!nuevaPassword || nuevaPassword.length < 6) {
            return res.status(400).json({ success: false, message: "La contraseña debe tener al menos 6 caracteres." });
        }

        const hash = await hashPassword(nuevaPassword);
        await db.query(
            `UPDATE usuario SET "contraseñahash" = $1 WHERE email = $2`,
            [hash, email]
        );

        resetCodes.delete(email);

        return res.status(200).json({ success: true, message: "Contraseña actualizada correctamente." });
    } catch (error) {
        console.error("Error en resetPassword:", error);
        return res.status(500).json({ success: false, message: "Error interno del servidor." });
    }
};
