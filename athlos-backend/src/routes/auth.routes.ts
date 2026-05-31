import { Router } from "express";
import { register, verifyEmail, login, forgotPassword, verifyResetCode, resetPassword } from "../controllers/auth.controller";

const router = Router();

router.post("/register", register);
router.post("/verify-email", verifyEmail);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/verify-reset-code", verifyResetCode);
router.post("/reset-password", resetPassword);

export default router;
