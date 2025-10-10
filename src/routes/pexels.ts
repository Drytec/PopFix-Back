import { Router } from "express";
import { getPopular, search } from "../controller/pexels";

const router = Router();

router.get("/popular", getPopular);
router.get("/search", search);

export default router;
