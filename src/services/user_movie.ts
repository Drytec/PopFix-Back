import { get } from "http";
import { supabase } from "../config/database";
import { getUserById } from "./user";

// Helpers: coerce incoming values (strings from client) into proper types
function parseNullableBoolean(v: any): boolean | null {
  if (v === null || v === undefined) return null;
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return !!v;
  if (typeof v === "string") {
    const s = v.trim().toLowerCase();
    if (s === "true") return true;
    if (s === "false") return false;
    if (s === "null" || s === "") return null;
  }
  return null;
}

function parseNullableNumber(v: any): number | null {
  if (v === null || v === undefined) return null;
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number(v);
    if (!Number.isNaN(n) && Number.isFinite(n)) return n;
    return null;
  }
  return null;
}

export async function updateUserMovie(
  userId: string,
  movieId: string,
  updates: Record<string, any>,
) {
  const toUpdate: Record<string, any> = {};

  // Coerce incoming is_favorite values (allow 'true'/'false' strings)
  if ("is_favorite" in updates) {
    const fav = parseNullableBoolean(updates.is_favorite);
    // If client explicitly sent null -> set null
    if (fav === null && (updates.is_favorite === null || updates.is_favorite === "null")) {
      toUpdate.is_favorite = null;
    } else if (typeof fav === "boolean") {
      toUpdate.is_favorite = fav;
    }
  }

  // Coerce rating (allow numeric strings)
  if ("rating" in updates) {
    const r = parseNullableNumber(updates.rating);
    if (r === null && updates.rating === null) {
      toUpdate.rating = null;
    } else if (typeof r === "number" && r >= 1 && r <= 5) {
      toUpdate.rating = r;
    }
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
    .from("user_movies")
    // Return user_movies columns (rating/is_favorite) along with nested movie data
    .select(
      `
      movie_id,
      rating,
      is_favorite,
      movies (
        id,
        title,
        thumbnail_url,
        genre,
        source,
        rating
      )
    `,
    )
    .eq("user_id", userId)
    .eq("is_favorite", true);

  if (error) throw new Error(error.message);
  return data;
}

export async function insertFavoriteRatingUserMovie(
  userId: string,
  movieId: string,
  favorite: boolean | null,
  rating: number | null,
) {
  // Coerce inputs to proper types (accept strings from client)
  const fav = parseNullableBoolean(favorite);
  const r = parseNullableNumber(rating);

  if (r !== null && (r < 1 || r > 5)) {
    throw new Error("Rating must be between 1 and 5");
  }

  const { data, error } = await supabase
    .from("user_movies")
    .upsert(
      [
        {
          user_id: userId,
          movie_id: movieId,
          is_favorite: fav,
          rating: r,
        },
      ],
      { onConflict: "user_id, movie_id" },
    )
    .select();

  if (error) throw new Error(error.message);
  return data;
}

export async function insertUserMovieComment(
  userId: string,
  movieId: string,
  is_favorite: boolean | null,
  rating: number | null,
  content: string,
  avatar: string,
) {
  const { data: user_movie_data, error: user_movie_error } = await supabase
    .from("user_movies")
    .upsert(
      [
        {
          user_id: userId,
          movie_id: movieId,
          is_favorite: is_favorite,
          rating: rating,
        },
      ],
      { onConflict: "user_id, movie_id" },
    )
    .select()
    .single();

  if (user_movie_error) throw new Error(user_movie_error.message);

  const { data: comment_data, error: comment_error } = await supabase
    .from("comments")
    .insert([
      {
        user_movie_user_id: user_movie_data.user_id,
        user_movie_movie_id: user_movie_data.movie_id,
        content: content,
        avatar: avatar,
      },
    ])
    .select()
    .single();
  if (comment_error) throw new Error(comment_error.message);
  return comment_data;
}

export async function updateUserMovieComment(
  commentId: string,
  updates: Record<string, any>,
) {
  const toUpdate: Record<string, any> = {};

  if (typeof updates.content === "string") {
    toUpdate.content = updates.content;
  }

  const { data, error } = await supabase
    .from("comments")
    .update(toUpdate)
    .eq("id", commentId)
    .select();

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteUserMovieComment(commentId: string) {
  const { error } = await supabase
    .from("comments")
    .delete()
    .eq("id", commentId);
  if (error) throw new Error(error.message);
}

export async function getUserMovieComments(user_id: string, movie_id: string) {
  const { data, error } = await supabase
    .from("comments")
    .select()
    .eq("user_movie_user_id", user_id)
    .eq("user_movie_movie_id", movie_id);

  if (error) throw new Error(error.message);
  return data;
}

// Returns all comments for a given movie (across users)
export async function getCommentsForMovie(movie_id: string) {
  const { data, error } = await supabase
    .from("comments")
    .select()
    .eq("user_movie_movie_id", movie_id);

  if (error) throw new Error(error.message);
  return data;
}

export async function getCommentById(commentId: string) {
  const { data, error } = await supabase
    .from("comments")
    .select()
    .eq("id", commentId);

  if (error) throw new Error(error.message);
  return data;
}

export async function getUserMovieMovies(user_id: string, movie_id: string) {
  const { data, error } = await supabase
    .from("user_movies")
    .select()
    .eq("user_id", user_id)
    .eq("movie_id", movie_id)
    .single();

  if (error) throw new Error(error.message);
  return data;
}
export async function getRatingMovies(movie_id: string): Promise<number> {

  const { data, error } = await supabase
    .from('user_movies')
    .select('rating')
    .eq('movie_id', movie_id);
  if (error) throw new Error(error.message);
  // Coerce ratings to numbers to avoid string/undefined issues returned by Supabase
  const ratings = data
    .map((item: any) => {
      const n = Number(item?.rating);
      return Number.isFinite(n) ? n : null;
    })
    .filter((r: any) => r !== null) as number[];
  if (ratings.length === 0) return 0;
  const avgRating = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
  // Round to 1 decimal (e.g., 3.6) which is the desired UI display precision
  return parseFloat(avgRating.toFixed(1));

}
