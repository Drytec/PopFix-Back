import fetch from "node-fetch";

const PEXELS_BASE_URL = "https://api.pexels.com";
const API_KEY = process.env.PEXELS_API_KEY!;

export async function searchMovies(query: string, perPage = 10) {
  const response = await fetch(
    `${PEXELS_BASE_URL}/videos/search?query=${encodeURIComponent(query)}&per_page=${perPage}`,
    {
      headers: {
        Authorization: API_KEY,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Error al buscar videos: ${response.statusText}`);
  }

  const data: any = await response.json();
  return data.videos; 
}

export async function getPopularMovies(perPage = 10) {
  const response = await fetch(`${PEXELS_BASE_URL}/videos/popular?per_page=${perPage}`, {
    headers: { Authorization: API_KEY },
  });

  if (!response.ok) {
    throw new Error(`Error al obtener videos populares: ${response.statusText}`);
  }

  const data: any = await response.json();
  return data.videos;
}
