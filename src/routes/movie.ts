import { Router } from "express";
import {
  getFavoriteMovies,
  updateMoviebyUser,
  insertFavoriteRating,
  getAllMovies,
  getMixed,
  getByGenrePexels,
  searchMoviesController,
} from "../controller/movie";

const router = Router();
router.get("/", getAllMovies);
router.get("/mixed", getMixed);
router.get("/by-genre", getByGenrePexels);
router.get("/search", searchMoviesController);
router.get("/favorites/:userId", getFavoriteMovies);
router.put("/update/:userId", updateMoviebyUser);
router.post("/insertFavoriteRating/:userId", insertFavoriteRating);

export default router;
