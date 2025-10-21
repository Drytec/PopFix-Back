import { Request, Response } from "express";

import {
  getUserFavoriteMovies,
  updateUserMovie,
  insertFavoriteRatingUserMovie,
} from "../services/user_movie";

import { getMovieById, addMovie } from "../services/movie";

export async function getFavoriteMovies(req: Request, res: Response) {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: "Missing userId parameter." });
    }

    const favorites = await getUserFavoriteMovies(userId);
    return res.status(200).json(favorites);
  } catch (err: any) {
    console.error("Error fetching favorite movies:", err.message);
    return res.status(500).json({ error: "Failed to fetch favorite movies" });
  }
}

export async function updateMoviebyUser(req: Request, res: Response) {
  try {
    const { userId } = req.params;
    const { movieId } = req.body;

    const updates = req.body;

    if (!userId || !movieId) {
      return res
        .status(400)
        .json({ error: "Missing userId or movieId parameter" });
    }

    // Call the service
    const updatedMovie = await updateUserMovie(userId, movieId, updates);

    if (!updatedMovie) {
      return res.status(404).json({ error: "Movie for this user not found" });
    }

    return res.status(200).json({
      message: "User movie updated successfully",
      data: updatedMovie,
    });
  } catch (err: any) {
    console.error("Error updating the user's movie: ", err.message);
    return res.status(500).json({ error: "Failed to update user's movie" });
  }
}

export async function insertFavoriteRating(req: Request, res: Response) {
  try {
    const userId = req.params.userId;
    const { movieId, favorite, rating, title, thumbnail_url, genre, source } =
      req.body;
    if (!userId || !movieId) {
      return res
        .status(400)
        .json({ error: "Missing userId or movieId parameter" });
    }

    let movie;
    try {
      movie = await getMovieById(movieId);
    } catch (err: any) {
      // Si no se encuentra la película, Supabase devuelve error
      if (
        err.message.includes("No rows found") ||
        err.message.includes("single()")
      ) {
        movie = null;
      } else {
        throw err;
      }
    }

    // 2️⃣ Si no existe, crearla
    if (!movie) {
      if (!title || !thumbnail_url || !genre || !source) {
        return res.status(400).json({
          error:
            "Missing movie data to create new entry (title, thumbnail_url, genre, source)",
        });
      }

      const createdMovie = await addMovie(
        movieId,
        title,
        thumbnail_url,
        genre,
        source,
      );
      movie = createdMovie[0];
    }

    const result = await insertFavoriteRatingUserMovie(
      userId,
      movieId,
      favorite,
      rating,
    );
    return res.status(201).json({
      message: "Favorite and rating inserted successfully",
      data: result,
    });
  } catch (err: any) {
    console.error("Error inserting favorite and rating:", err);
    return res
      .status(500)
      .json({ error: err.message || "Internal server error" });
  }
}
