import { Request, Response } from "express";

import {
  getUserFavoriteMovies,
  updateUserMovie,
  insertFavoriteRatingUserMovie,
  insertUserMovieComment,
  updateUserMovieComment,
  getUserMovieComments,
  getCommentById,
  deleteUserMovieComment,
  getUserMovieMovies,
} from "../services/user_movie";

import {
  getMovieById,
  addMovie,
  getMovies,
  searchMoviesDb,
} from "../services/movie";
import { getPopularMoviesMapped, getMoviesByGenre } from "../services/pexels";
import { getUserById } from "../services/user";

// Formatea duración: "Xh Ym" si hay horas, "Xm" si hay minutos, "Zs" cuando minutos = 0
function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m`;
  return `${s}s`;
}

export async function getAllMovies(_req: Request, res: Response) {
  try {
    const movies = await getMovies();
    return res.status(200).json(movies);
  } catch (err: any) {
    console.error("Error fetching movies:", err.message);
    return res.status(500).json({ error: "Failed to fetch movies" });
  }
}

export async function getMixed(req: Request, res: Response) {
  try {
    const { limit, quality, maxWidth } = req.query;
    const perPage = typeof limit === "string" ? Number(limit) : 25;
    const opts: any = {};
    if (typeof quality === "string") opts.quality = quality as any;
    if (typeof maxWidth === "string") opts.maxWidth = Number(maxWidth);
    const movies = await getPopularMoviesMapped(perPage, opts);
    return res.status(200).json(movies);
  } catch (err: any) {
    console.error("Error fetching mixed movies:", err.message);
    return res.status(500).json({ error: "Failed to fetch mixed movies" });
  }
}

export async function getByGenrePexels(req: Request, res: Response) {
  try {
    const { genre, perPage } = req.query;
    if (!genre || typeof genre !== "string") {
      return res.status(400).json({ error: "genre is required" });
    }
    const n = typeof perPage === "string" ? Number(perPage) : 12;
    const items = await getMoviesByGenre(genre, n);
    return res.status(200).json(items);
  } catch (err: any) {
    console.error("Error fetching Pexels by genre:", err.message);
    return res.status(500).json({ error: "Failed to fetch Pexels by genre" });
  }
}

export async function searchMoviesController(req: Request, res: Response) {
  try {
    const { q, limit } = req.query;
    if (!q || typeof q !== "string")
      return res.status(400).json({ error: "q is required" });
    const n = typeof limit === "string" ? Number(limit) : 50;
    const items = await searchMoviesDb(q, n);
    return res.status(200).json(items);
  } catch (err: any) {
    console.error("Error searching movies:", err.message);
    return res.status(500).json({ error: "Failed to search movies" });
  }
}

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
    const {
      movieId,
      favorite,
      rating,
      title,
      thumbnail_url,
      genre,
      source,
      duration_seconds,
      duration,
    } = req.body;
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
      if (
        !createdMovie ||
        (Array.isArray(createdMovie) && createdMovie.length === 0)
      ) {
        return res.status(500).json({ error: "Failed to create movie" });
      }
      movie = Array.isArray(createdMovie) ? createdMovie[0] : createdMovie;
    }

    const result = await insertFavoriteRatingUserMovie(
      userId,
      movieId,
      favorite,
      rating,
    );

    // Duración opcional: si cliente envía duration_seconds, devolvemos también los segundos y el formato solicitado
    let durationFormatted: string | null = null;
    let durationSecondsEcho: number | null = null;
    if (
      typeof duration_seconds === "number" &&
      Number.isFinite(duration_seconds)
    ) {
      durationSecondsEcho = Math.floor(duration_seconds);
      durationFormatted = formatDuration(durationSecondsEcho);
    } else if (typeof duration === "string") {
      durationFormatted = duration; // permitir que el front mande ya formateado si lo prefiere
    }
    return res.status(201).json({
      message: "Favorite and rating inserted successfully",
      data: result,
      duration: durationSecondsEcho, // duración en segundos
      duration_formatted: durationFormatted, // string amigable "Xh Ym" | "Xm" | "Zs"
    });
  } catch (err: any) {
    console.error("Error inserting favorite and rating:", err);
    return res
      .status(500)
      .json({ error: err.message || "Internal server error" });
  }
}

export async function addUserMovieComment(req: Request, res: Response) {
  try {
    const userId = req.params.userId;
    const { movieId, text } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "Missing userId parameter." });
    }

    let is_favorite: boolean;
    let rating_num: any;

    if (!getUserMovieMovies(userId, movieId)) {
      is_favorite = false;
      rating_num = null;
    } else {
      const { favorite, rating } = await getUserMovieMovies(userId, movieId);
      is_favorite = favorite;
      rating_num = rating;
    }

    const user_data: any = await getUserById(userId);
    const user_name: string = user_data.name;
    const user_surname: string = user_data.surname;

    let avatar: string;

    const name_array: string[] = [user_name, user_surname];

    avatar = (name_array[0][0] + name_array[1][0]).toUpperCase();

    const comment = await insertUserMovieComment(
      userId,
      movieId,
      is_favorite,
      rating_num,
      text,
      avatar,
    );
    return res.status(200).json({
      message: "Comment created and inserted correctly",
      comment,
    });
  } catch (err: any) {
    console.error("Error adding comment to movie:", err.message);
    return res.status(500).json({ error: "Failed to add comment" });
  }
}

export async function editUserMovieComment(req: Request, res: Response) {
  try {
    const commentId = req.params.commentId;
    const updates = req.body;

    const updatedComment = await updateUserMovieComment(commentId, updates);

    return res.status(200).json({
      message: "Comment updated correctly",
      updatedComment,
    });
  } catch (err: any) {
    console.error("Error updating comment:", err.message);
    return res.status(500).json({ error: "Failed to update comment" });
  }
}

export async function getCommentsByUserMovie(req: Request, res: Response) {
  try {
    const user_id = req.body.userId;
    const movie_id = req.body.movieId;

    const comments = await getUserMovieComments(user_id, movie_id);

    return res.status(200).json({
      message: "Comments accessed correctly",
      comments,
    });
  } catch (err: any) {
    console.error("Error getting comments: ", err.message);
    return res.status(500).json({ error: "Failed to get comments" });
  }
}

export async function getSingleComment(req: Request, res: Response) {
  try {
    const commentId = req.params.commentId;

    const comment = await getCommentById(commentId);

    return res.status(200).json({
      message: "Comment accesed correctly",
      comment,
    });
  } catch (err: any) {
    console.error("Error getting comment: ", err.message);
    return res.status(500).json({ error: "Failed to get comment" });
  }
}

export async function deleleComment(req: Request, res: Response) {
  try {
    const commentId = req.params.commentId;
    await deleteUserMovieComment(commentId);
    return res.status(200).json({ message: "Comment deleted successfully" });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
