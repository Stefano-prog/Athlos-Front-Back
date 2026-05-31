import { Router } from "express";
import { getAll,getRutina  } from "../controllers/exercise.controller";

const router = Router();

router.get("/allexercise", getAll);
router.get("/rutina", getRutina);

export default router;
