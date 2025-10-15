import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import {
    registerUser,
    loginUser,
    getUserId,
    updateUserId,
    deleteUserId,
    getAllUsers,
    changePassword,
    logoutUser,
} from '../controller/user';


const router = Router();

router.get("/", getAllUsers);
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/logout", logoutUser); 
router.get("/:id", getUserId);
router.put("/:id", updateUserId);
router.post("/change-password", authMiddleware, changePassword);
router.delete("/:id", deleteUserId);

export default router;