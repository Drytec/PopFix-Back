import { Router } from "express";
import {
  getFavoriteMovies,
  updateMoviebyUser,
  insertFavoriteRating,
  addFavorite,
  setRating,
  getAllMovies,
  getMixed,
  getByGenrePexels,
  searchMoviesController,
  addUserMovieComment,
  editUserMovieComment,
  getCommentsByUserMovie,
  getSingleComment,
  deleleComment,
  deleteFavorite,
  getMovieByIdController,
  getMovieDetailsController,
  getUserRatingsController,
} from "../controller/movie";
import { getMovieById } from "../services/movie";

const router = Router();
router.get("/", getAllMovies);
router.get("/mixed", getMixed);
router.get("/by-genre", getByGenrePexels);
router.get("/search", searchMoviesController);
router.get("/favorites/:userId", getFavoriteMovies);
router.get("/ratings/:userId", getUserRatingsController);
router.put("/updateMovie/:userId", updateMoviebyUser);
router.post("/insertFavoriteRating/:userId", insertFavoriteRating);
// New: separate endpoints for favorites and ratings
router.post("/favorite/:userId", addFavorite);
router.put("/rating/:userId", setRating);
router.post("/addUserMovieComment/:userId", addUserMovieComment);
router.put("/editComment/:commentId", editUserMovieComment);
router.delete("/deleteComment/:commentId", deleleComment);
router.delete("/favorites/:userId/:movieId", deleteFavorite);
router.get("/getUserMovieComments/", getCommentsByUserMovie);
router.get("/getComment/:commentId", getSingleComment);
router.get("/getMovie", getMovieByIdController);
router.get("/details/:movieId", getMovieDetailsController);

export default router;
