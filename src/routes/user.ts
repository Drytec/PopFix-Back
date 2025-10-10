import { Router } from 'express';
import {
    registerUser,
    loginUser,
    getUserId,

} from '../controller/user';

const router = Router();

router.post("/register", registerUser);

router.post("/login", loginUser);

router.get("/:id", getUserId);



export default router;