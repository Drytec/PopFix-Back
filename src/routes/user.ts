import { Router } from 'express';
import {
    registerUser,
    loginUser,
    getUserId,
    updateUserId,
    deleteUserId,
} from '../controller/user';

const router = Router();

router.post("/register", registerUser);

router.post("/login", loginUser);

router.get("/:id", getUserId);

router.put("/:id", updateUserId);


router.delete("/:id", deleteUserId);

export default router;