import { Router } from "express";
import {
  getFavoriteMovies,
  updateMoviebyUser,
  insertFavoriteRating,
} from "../controller/movie";

const router = Router();
router.get("/favorites/:userId", getFavoriteMovies);
router.put("/update/:userId", updateMoviebyUser);
router.post("/insertFavoriteRating/:userId", insertFavoriteRating);

export default router;
