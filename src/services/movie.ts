import { supabase } from "../config/database";

/**
 * Retrieves all movies from the "movies" table in the Supabase database.
 *
 * @async
 * @function getMovies
 * @returns {Promise<Object[]>} A promise that resolves to an array of movie objects.
 * @throws {Error} If a Supabase error occurs while fetching data.
 *
 * @example
 * const movies = await getMovies();
 * console.log(movies.length); // e.g., 15
 */
export async function getMovies() {
  const { data, error } = await supabase.from("movies").select("*");
  if (error) throw new Error(error.message);
  return data;
}

/**
 * Inserts a new movie record into the "movies" table.
 *
 * @async
 * @function addMovie
 * @param {string} id - The unique identifier for the movie.
 * @param {string} title - The title of the movie.
 * @param {string} thumbnail_url - The URL to the movie's thumbnail image.
 * @param {string} genre - The genre or category of the movie.
 * @param {string} source - The video source or streaming URL.
 * @returns {Promise<Object[]>} A promise that resolves to the inserted movie record(s).
 * @throws {Error} If a Supabase error occurs while inserting the data.
 *
 * @example
 * const newMovie = await addMovie("123", "Inception", "https://img.jpg", "Sci-Fi", "https://stream.com/inception");
 * console.log(newMovie[0].title); // "Inception"
 */
export async function addMovie(
  id: string,
  title: string,
  thumbnail_url: string,
  genre: string,
  source: string,
  extras?: { director?: string | null; suggested_rating?: number | null },
) {
  const baseRecord: any = { id, title, thumbnail_url, genre, source };
  if (extras && typeof extras.director !== "undefined") baseRecord.director = extras.director;
  if (extras && typeof extras.suggested_rating !== "undefined") baseRecord.suggested_rating = extras.suggested_rating;

  // Try insert with extras; if columns don't exist, fallback to base fields
  let { data, error } = await supabase.from("movies").insert([baseRecord]).select();
  if (error && /column .* does not exist/i.test(error.message)) {
    const fallback = { id, title, thumbnail_url, genre, source };
    const res = await supabase.from("movies").insert([fallback]).select();
    if (res.error) throw new Error(res.error.message);
    return res.data;
  }
  if (error) throw new Error(error.message);
  return data;
}

/**
 * Upserts multiple movies into the movies table.
 * Only standard columns are used to avoid schema mismatch.
 */
// Removed upsertMoviesBulk (sync feature deprecated)

/** Simple title/genre search in movies */
export async function searchMoviesDb(query: string, limit = 50) {
  const q = `%${query}%`;
  const { data, error } = await supabase
    .from("movies")
    .select("*")
    .or(`title.ilike.${q},genre.ilike.${q}`)
    .limit(limit);
  if (error) throw new Error(error.message);
  return data;
}

/**
 * Retrieves a movie by its unique ID.
 *
 * @async
 * @function getMovieById
 * @param {string} id - The unique identifier of the movie to retrieve.
 * @returns {Promise<Object>} A promise that resolves to the movie object.
 * @throws {Error} If the movie is not found or a Supabase error occurs.
 *
 * @example
 * const movie = await getMovieById("123");
 * console.log(movie.title); // "Inception"
 */
export async function getMovieById(id: string) {
  const { data, error } = await supabase
    .from("movies")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

/**
 * Retrieves all movies associated with a specific user.
 *
 * This function assumes there is a relation between a user and movies,
 * likely via a linking table (e.g., a "watched_movies" or "user_movies" table)
 * that includes `user_id`, `watched_at`, and nested movie data.
 *
 * @async
 * @function getUserMovies
 * @param {string} userId - The ID of the user whose movies are to be retrieved.
 * @returns {Promise<Object[]>} A promise that resolves to an array of movie records associated with the user.
 * @throws {Error} If a Supabase error occurs while fetching data.
 *
 * @example
 * const userMovies = await getUserMovies("user_456");
 * console.log(userMovies[0].movies.title); // "Avatar"
 */
// Removed getUserMovies (unused)
