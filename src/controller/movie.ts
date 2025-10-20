import { Request, Response } from "express";

import { getUserFavoriteMovies, updateUserMovie } from "../services/user_movie";

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
    const { movieId } = req.params;

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
