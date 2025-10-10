import { supabase } from "../config/database";

export async function getMovies() {
  const { data, error } = await supabase.from("movies").select("*");
  if (error) throw new Error(error.message);
  return data;
}

export async function addMovie(
  id: string,
  title: string,
  thumbnail_url: string,
  genre: string,
  source: string,
) {
  const { data, error } = await supabase
    .from("movies")
    .insert([{ id, title, thumbnail_url, genre, source }])
    .select();

  if (error) throw new Error(error.message);
  return data;
}

export async function getMovieById(id: string) {
  const { data, error } = await supabase
    .from("movies")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function getUserMovies(userId: string) {
  const { data, error } = await supabase
    .from("movies")
    .select(
      `
        watched_at,
        movies (
          id,
          title,
          thumbnail_url,
          genre,
          source
        )
      `,
    )
    .eq("user_id", userId);

  if (error) throw new Error(error.message);
  return data;
}
