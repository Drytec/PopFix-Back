/**
 * Represents the structure of a movie entity in the application.
 *
 * This interface defines the core properties used to describe a movie,
 * including its ID, title, description, and genre.
 *
 * @interface movieModel
 * @property {number} movieId - The unique numeric identifier of the movie.
 * @property {string} title - The title of the movie.
 * @property {string} description - A short summary or synopsis of the movie.
 * @property {string} genre - The movie's genre or category (e.g., "Action", "Drama").
 *
 * @example
 * const movie: movieModel = {
 *   movieId: 101,
 *   title: "Interstellar",
 *   description: "A team of explorers travels through a wormhole in space.",
 *   genre: "Sci-Fi"
 * };
 */
export interface movieModel {
  movieId: number;
  title: string;
  description: string;
  genre: string;
}
