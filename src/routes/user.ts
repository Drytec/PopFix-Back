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

const router = Router();

router.get("/", getAllUsers);

router.post("/register", registerUser);

router.post("/login", loginUser);

router.get("/:id", getUserId);

router.put("/:id", updateUserId);


// Esta ruta debe ir protegida con auth middleware
router.post("/change-password", changePassword);
router.delete("/:id", deleteUserId);

export default router;