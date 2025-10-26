import { Router } from "express";
import {
  getFavoriteMovies,
  updateMoviebyUser,
  insertFavoriteRating,
  getAllMovies,
  getMixed,
  getByGenrePexels,
  searchMoviesController,
  addUserMovieComment,
  editUserMovieComment,
  getCommentsByUserMovie,
  getSingleComment,
  deleleComment,
} from "../controller/movie";

const router = Router();
router.get("/", getAllMovies);
router.get("/mixed", getMixed);
router.get("/by-genre", getByGenrePexels);
router.get("/search", searchMoviesController);
router.get("/favorites/:userId", getFavoriteMovies);
router.put("/updateMovie/:userId", updateMoviebyUser);
router.post("/insertFavoriteRating/:userId", insertFavoriteRating);
router.post("/addUserMovieComment/:userId", addUserMovieComment);
router.put("/editComment/:commentId", editUserMovieComment);
router.delete("/deleteComment/:commentId", deleleComment);
router.get("/getUserMovieComments/", getCommentsByUserMovie);
router.get("/getComment/:commentId", getSingleComment);

export default router;
