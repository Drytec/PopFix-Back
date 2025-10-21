import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import {
    registerUser,
    loginUser,
    getUserId,
    updateUserId,
    deleteUserId,
    getAllUsers,
    logoutUser,
} from '../controller/user';


const router = Router();

router.get("/", getAllUsers);
router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/:id", getUserId);
router.post("/logout",logoutUser);
router.put("/:id", updateUserId);
router.delete("/:id", deleteUserId);

export default router;