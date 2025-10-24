import { get } from "http";
import { supabase } from "../config/database";
import { getUserById } from "./user";

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
    .from("user_movies")
    .select(
      `
      movie_id,
      movies (
        id,
        title,
        thumbnail_url,
        genre,
        source
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
  if (rating !== null && (rating < 1 || rating > 5)) {
    throw new Error("Rating must be between 1 and 5");
  }

  const { data, error } = await supabase
    .from("user_movies")
    .upsert(
      [
        {
          user_id: userId,
          movie_id: movieId,
          is_favorite: favorite,
          rating: rating,
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

  if (updates.content === "string") {
    toUpdate.content = updates.content;
  } else {
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

export async function getCommentById(commentId: string) {
  const { data, error } = await supabase
    .from("comments")
    .select()
    .eq("id", commentId);

  if (error) throw new Error(error.message);
  return data;
}
