import { Router } from "express";
import { getPopular, search, getPopularMapped } from "../controller/pexels";

const router = Router();

router.get("/popular", getPopular);
router.get("/popular-mapped", getPopularMapped);
router.get("/search", search);

export default router;
