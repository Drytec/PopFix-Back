const PEXELS_BASE_URL = "https://api.pexels.com";
const API_KEY = process.env.PEXELS_API_KEY!;

/**
 * Searches for movie-like videos on the Pexels API based on a given query string.
 *
 * This function performs a request to the Pexels `/videos/search` endpoint,
 * using the API key stored in `PEXELS_API_KEY`. It returns an array of video objects
 * that match the search query.
 *
 * @async
 * @function searchMovies
 * @param {string} query - The search term to find related videos (e.g., "action", "comedy").
 * @param {number} [perPage=10] - The maximum number of results to return per page.
 * @returns {Promise<Object[]>} A promise that resolves to an array of video objects from Pexels.
 * @throws {Error} If the API request fails or returns a non-OK response.
 *
 * @example
 * const movies = await searchMovies("sci-fi", 5);
 * console.log(movies[0].video_files[0].link);
 */
export async function searchMovies(query: string, perPage = 10) {
  const response = await fetch(
    `${PEXELS_BASE_URL}/videos/search?query=${encodeURIComponent(query)}&per_page=${perPage}`,
    {
      headers: {
        Authorization: API_KEY,
      },
    },
  );

  if (!response.ok) {
    throw new Error(`Error al buscar videos: ${response.statusText}`);
  }

  const data: any = await response.json();
  return data.videos;
}

/**
 * Retrieves a list of popular videos from the Pexels API.
 *
 * This function performs a request to the Pexels `/videos/popular` endpoint
 * and returns a collection of trending or featured video objects.
 *
 * @async
 * @function getPopularMovies
 * @param {number} [perPage=10] - The maximum number of popular videos to return.
 * @returns {Promise<Object[]>} A promise that resolves to an array of popular video objects.
 * @throws {Error} If the API request fails or returns a non-OK response.
 *
 * @example
 * const popular = await getPopularMovies(8);
 * console.log(popular.map(video => video.url));
 */
export async function getPopularMovies(perPage = 10) {
  const response = await fetch(
    `${PEXELS_BASE_URL}/videos/popular?per_page=${perPage}`,
    {
      headers: { Authorization: API_KEY },
    },
  );

  if (!response.ok) {
    throw new Error(
      `Error al obtener videos populares: ${response.statusText}`,
    );
  }

  const data: any = await response.json();
  return data.videos;
}
