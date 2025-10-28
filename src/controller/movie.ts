import { Request, Response } from "express";

import {
  getUserFavoriteMovies,
  updateUserMovie,
  insertFavoriteRatingUserMovie,
  insertUserMovieComment,
  updateUserMovieComment,
  getUserMovieComments,
  getCommentsForMovie,
  getCommentById,
  deleteUserMovieComment,
  getUserMovieMovies,
  getRatingMovies,
  getUserRatings,

} from "../services/user_movie";

import {
  getMovieById,
  addMovie,
  getMovies,
  searchMoviesDb,
  updateMovieById,
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
    const userId = typeof req.query.userId === 'string' ? req.query.userId : undefined;
    const movies = await getPopularMoviesMapped(perPage, opts, userId);
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
      title,
      thumbnail_url,
      genre,
      source,
      duration_seconds,
      duration,
      rating,
    } = req.body;

    // DEBUG: log incoming request for troubleshooting favorites issues
    console.debug('[DEBUG] insertFavoriteRating called', {
      params: req.params,
      body: req.body,
    });
  
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


    if (!movie) {
      // allow source to be optional (some providers don't provide a source URL)
      if (!title || !thumbnail_url || !genre) {
        return res.status(400).json({
          error:
            "Missing movie data to create new entry (title, thumbnail_url, genre)",
        });
      }

      const createdMovie = await addMovie(
        movieId,
        title,
        thumbnail_url,
        genre,
        source || null,
        rating,
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

    // Recalculate suggested rating (average). Only update movie.rating when
    // the computed value is a valid rating (>= 1). Some flows return 0 when
    // there are no ratings yet and writing 0 violates the DB check constraint.
    const sugestedRatings = await getRatingMovies(movieId);
    let newMovie: any = movie;
    if (typeof sugestedRatings === 'number' && sugestedRatings >= 1) {
      newMovie = await updateMovieById(movieId, { rating: sugestedRatings });
    } else {
      // Skip updating movie.rating to avoid DB constraint violation
      newMovie = movie;
    }

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
      suggestedRating: sugestedRatings,
      updatedMovie: newMovie,
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

    // Determine existing user_movie row (if any) to inherit favorite/rating
    let is_favorite = false;
    let rating_num: number | null = null;
    let userMovieRow: any = null;
    try {
      userMovieRow = await getUserMovieMovies(userId, movieId);
    } catch (e) {
      userMovieRow = null;
    }

    if (userMovieRow) {
      // DB column is likely `is_favorite` and `rating`
      is_favorite = !!userMovieRow.is_favorite;
      rating_num = userMovieRow.rating ?? null;
    }

  const user_data: any = await getUserById(userId);
  const user_name: string = user_data.name;
  // Sanitize backend placeholder values like 'N/A' -> treat as empty
  const user_surname: string = (user_data.surname && user_data.surname !== 'N/A') ? user_data.surname : '';

    let avatar: string;

    const name_array: string[] = [user_name || "", user_surname || ""];
    // Build avatar initials: if we have surname, use first letter of name + first of surname (MR).
    // If only one name exists, use first two letters of the name (MI for Michael).
    const first = (name_array[0] || "").trim();
    const second = (name_array[1] || "").trim();
    if (first && second) {
      avatar = (first[0] + second[0]).toUpperCase();
    } else if (first) {
      avatar = first.substring(0, 2).toUpperCase();
    } else {
      avatar = "US"; // fallback initials
    }

    const comment = await insertUserMovieComment(
      userId,
      movieId,
      is_favorite,
      rating_num,
      text,
      avatar,
    );
    // Attach author name to response so frontend can display the comment with the user's name
    const responseComment = {
      ...comment,
      author_name: user_name,
      author_surname: user_surname,
      avatar,
    };

    return res.status(200).json({
      message: "Comment created and inserted correctly",
      comment: responseComment,
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

export async function deleteFavorite(req: Request, res: Response) {
  try {
    const { userId, movieId } = req.params as any;
    // DEBUG: log delete favorite requests
    console.debug('[DEBUG] deleteFavorite called', { params: req.params });
    if (!userId || !movieId) {
      return res.status(400).json({ error: "Missing userId or movieId" });
    }

    // Set is_favorite to false (explicitly un-favorite). We keep the row for rating/history.
    const updated = await updateUserMovie(userId, movieId, { is_favorite: false });
    return res.status(200).json({ message: "Favorite removed", data: updated });
  } catch (err: any) {
    console.error("Error deleting favorite:", err.message);
    return res.status(500).json({ error: err.message || "Failed to remove favorite" });
  }
}

export async function getMovieByIdController(req:Request, res:Response) {
  try{
    const {movie_id}= req.body;
    console.log(movie_id)
    const movie=await getMovieById(movie_id);
    return res.status(200).json(movie);

  }catch(err:any){
     return res.status(500).json({ error: err.message });
  } 
}

export async function getMovieDetailsController(req: Request, res: Response) {
  try {
    const movieId = req.params.movieId;
    const userId = req.query.userId as string | undefined;
    if (!movieId) return res.status(400).json({ error: 'movieId required' });

    const movie = await getMovieById(movieId);

    // Get user's rating if userId provided
    let userRating: number | null = null;
    if (userId) {
      try {
        const um = await getUserMovieMovies(userId, movieId);
        if (um && typeof um.rating === 'number') userRating = um.rating;
      } catch (e) {
        // ignore
      }
    }

    // Get all comments for the movie and attach author name / surname
    const commentsRaw = await getCommentsForMovie(movieId);
    const comments: any[] = [];
    for (const c of commentsRaw) {
      try {
        const author = await getUserById(String(c.user_movie_user_id));
        const author_name = author?.name || '';
        const author_surname = (author?.surname && author.surname !== 'N/A') ? author.surname : '';
        const avatar = c.avatar || ((author_name && author_surname) ? (author_name[0] + author_surname[0]).toUpperCase() : (author_name ? author_name.substring(0,2).toUpperCase() : ''));
        comments.push({ ...c, author_name, author_surname, avatar });
      } catch (e) {
        comments.push({ ...c });
      }
    }

    return res.status(200).json({ movie, userRating, comments });
  } catch (err: any) {
    console.error('Error getting movie details:', err);
    return res.status(500).json({ error: 'Failed to get movie details' });
  }
}

export async function getUserRatingsController(req: Request, res: Response) {
  try {
    const { userId } = req.params;
    if (!userId) return res.status(400).json({ error: 'Missing userId parameter' });
    const ratings = await getUserRatings(userId);
    return res.status(200).json({ ratings });
  } catch (err: any) {
    console.error('Error fetching user ratings:', err?.message || err);
    return res.status(500).json({ error: 'Failed to fetch user ratings' });
  }
}

export async function addFavorite(req: Request, res: Response) {
  try {
    const userId = req.params.userId;
    const { movieId, title, thumbnail_url, genre, source, duration_seconds, duration } = req.body;

    if (!userId || !movieId) {
      return res.status(400).json({ error: "Missing userId or movieId parameter" });
    }

    // Ensure movie exists (same logic as insertFavoriteRating)
    let movie;
    try {
      movie = await getMovieById(movieId);
    } catch (err: any) {
      if (err.message.includes("No rows found") || err.message.includes("single()")) {
        movie = null;
      } else {
        throw err;
      }
    }

    if (!movie) {
      if (!title || !thumbnail_url || !genre) {
        return res.status(400).json({ error: "Missing movie data to create new entry (title, thumbnail_url, genre)" });
      }
      const createdMovie = await addMovie(movieId, title, thumbnail_url, genre, source || null, undefined);
      if (!createdMovie || (Array.isArray(createdMovie) && createdMovie.length === 0)) {
        return res.status(500).json({ error: "Failed to create movie" });
      }
      movie = Array.isArray(createdMovie) ? createdMovie[0] : createdMovie;
    }

    const result = await insertFavoriteRatingUserMovie(userId, movieId, true, null);
    const sugestedRatings = await getRatingMovies(movieId);
    let newMovie: any = movie;
    if (typeof sugestedRatings === 'number' && sugestedRatings >= 1) {
      newMovie = await updateMovieById(movieId, { rating: sugestedRatings });
    }

    return res.status(201).json({ message: 'Favorite added', data: result, suggestedRating: sugestedRatings, updatedMovie: newMovie });
  } catch (err: any) {
    console.error('Error adding favorite:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}

export async function setRating(req: Request, res: Response) {
  try {
    const userId = req.params.userId;
    const { movieId, rating } = req.body;

    if (!userId || !movieId) {
      return res.status(400).json({ error: 'Missing userId or movieId parameter' });
    }

    const rnum = typeof rating === 'number' ? rating : Number(rating);
    if (Number.isNaN(rnum) || rnum < 1 || rnum > 5) {
      return res.status(400).json({ error: 'rating must be a number between 1 and 5' });
    }

    // Upsert rating (preserve favorite flag if exists)
    const result = await insertFavoriteRatingUserMovie(userId, movieId, null, rnum);
    const sugestedRatings = await getRatingMovies(movieId);
    console.debug('[DEBUG] setRating computed suggestedRatings:', { movieId, sugestedRatings, userId, incomingRating: rnum });
    let newMovie: any = null;
    if (typeof sugestedRatings === 'number' && sugestedRatings >= 1) {
      // Ensure a movie row exists so the global rating can be merged into Pexels mapped results
      let existing = null;
      try {
        existing = await getMovieById(movieId);
      } catch (e) {
        existing = null;
      }
      if (!existing) {
        try {
          // Create a minimal movie record so movie.rating can be stored and later merged.
          // Use a fallback title/genre; frontends that originated the event usually have full metadata and will create richer records via insertFavoriteRating route.
          const created = await addMovie(movieId, `Video ${movieId}`, '', 'Video', '', sugestedRatings);
          newMovie = Array.isArray(created) ? created[0] : created;
        } catch (e) {
          // If create fails, still attempt to update (may fail silently)
          try {
            newMovie = await updateMovieById(movieId, { rating: sugestedRatings });
          } catch (ee) {
            newMovie = null;
          }
        }
      } else {
        newMovie = await updateMovieById(movieId, { rating: sugestedRatings });
      }
    }

    // Return Spanish confirmation and include the user's own rating for convenience
    return res.status(200).json({ message: 'Listo, tu valoración ha sido guardada', data: result, userRating: rnum, suggestedRating: sugestedRatings, updatedMovie: newMovie });
  } catch (err: any) {
    console.error('Error setting rating:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}