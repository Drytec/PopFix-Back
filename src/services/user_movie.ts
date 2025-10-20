import { supabase } from "../config/database";

export async function updateUserMovie(
  userId: string,
  movieId: string,
  updates: Record<string, any>,
) {
  const toUpdate: Record<string, any> = {};

  if (updates.is_favorite === null) {
    toUpdate.is_favorite = null;
  } else if (typeof updates.is_favorite === "boolean") {
    toUpdate.is_favorite = updates.is_favorite;
  }

  if (updates.rating === null) {
    toUpdate.rating = null;
  } else if (
    typeof updates.rating === "number" &&
    updates.rating >= 1 &&
    updates.rating <= 5
  ) {
    toUpdate.rating = updates.rating;
  }

  const { data, error } = await supabase
    .from("user_movies")
    .update(toUpdate)
    .eq("user_id", userId)
    .eq("movie_id", movieId)
    .select();

  if (error) throw new Error(error.message);
  return data[0];
}

export async function getUserFavoriteMovies(userId: string) {
  const { data, error } = await supabase
    .from("movies")
    .select(
      `
        movie_id,
        movies ( id, title, thumbnail_url, genre, source )
      `,
    )
    .eq("user_id", userId)
    .eq("is_favorite", true);

  if (error) throw new Error(error.message);
  return data;
}
