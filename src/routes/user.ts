import { Router } from 'express';
import {
    registerUser,
    loginUser,
    getUserId,
    updateUserId,
    deleteUserId,
    getAllUsers,
    changePassword,
} from '../controller/user';
import { authMiddleware } from '../middlewares/auth';

const router = Router();

router.get("/", getAllUsers);

router.post("/register", registerUser);

router.post("/login", loginUser);

router.get("/:id", getUserId);

router.put("/:id", updateUserId);

// Ruta protegida: requiere autenticación
router.post("/change-password", authMiddleware, changePassword);

router.delete("/:id", deleteUserId);

export default router;