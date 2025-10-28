const PEXELS_BASE_URL = "https://api.pexels.com";
// You can hardcode your Pexels API key here to avoid .env usage for now
// Example: const HARDCODED_PEXELS_API_KEY = "YOUR_PEXELS_API_KEY";
const HARDCODED_PEXELS_API_KEY = ""; // TODO: put your key here if desired
const API_KEY = HARDCODED_PEXELS_API_KEY || process.env.PEXELS_API_KEY || "";

import { supabase } from "../config/database";

export type MovieSummary = {
  id: string;
  title: string;
  thumbnail_url?: string;
  genre?: string;
  source?: string;
};

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
  if (!API_KEY) throw new Error("Pexels API key missing. Set HARDCODED_PEXELS_API_KEY in services/pexels.ts or PEXELS_API_KEY in env.");
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
  if (!API_KEY) throw new Error("Pexels API key missing. Set HARDCODED_PEXELS_API_KEY in services/pexels.ts or PEXELS_API_KEY in env.");
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

// Utilidad: convierte segundos en formato "2h 14m" o "14m" si < 1h
function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m`;
  return `${s}s`;
}

type SourceSelectOptions = {
  quality?: "sd" | "hd" | "low"; // sd por defecto; hd para alta; low para la menor resolución
  maxWidth?: number; // si se establece, seleccionar la fuente <= maxWidth, priorizando la más pequeña que cumpla
};

// Reglas determinísticas basadas en el ID numérico de Pexels
// - Género: depende del último dígito
// - Estrellas (rating): depende de los 3 dígitos anteriores al último
const GENRE_BY_LAST_DIGIT = [
  "accion",           // 0
  "drama",            // 1
  "comedia",          // 2
  "thriller",         // 3
  "terror",           // 4
  "ciencia ficcion",  // 5
  "accion",           // 6
  "drama",            // 7
  "comedia",          // 8
  "thriller",         // 9
];

function toNumericId(videoId: any): number {
  const n = Number(videoId);
  return Number.isFinite(n) ? Math.abs(Math.trunc(n)) : 0;
}

function deterministicGenreFromNumericId(numericId: number): string {
  const lastDigit = numericId % 10; // 0..9
  return GENRE_BY_LAST_DIGIT[lastDigit];
}

function deterministicRatingFromNumericId(numericId: number): number {
  // Tomamos los 3 dígitos anteriores al último
  const last3BeforeLast = Math.floor(numericId / 10) % 1000; // 0..999
  // Mapear a rango 2.1 .. 5.0 y redondear a 1 decimal
  const value = 2.1 + (last3BeforeLast / 999) * (5.0 - 2.1);
  const clamped = Math.max(2.1, Math.min(5.0, value));
  return parseFloat(clamped.toFixed(1));
}

function selectBestSource(files: any[], opts: SourceSelectOptions = {}) {
  const mp4Files = files.filter(
    (f: any) => typeof f?.file_type === "string" && f.file_type.toLowerCase().includes("mp4"),
  );
  if (mp4Files.length === 0) return null;

  const byWidthAsc = [...mp4Files].sort((a, b) => (a.width || 0) - (b.width || 0));

  // Si maxWidth está definido, elegimos la opción más pequeña que esté por debajo o igual a ese ancho
  if (typeof opts.maxWidth === "number" && opts.maxWidth > 0) {
    const within = byWidthAsc.filter((f) => (f.width || 0) <= opts.maxWidth!);
    const pick = within[0] || byWidthAsc[0];
    return pick?.link || null;
  }

  // Selección por calidad
  const quality = opts.quality || "sd"; // por defecto, baja calidad
  if (quality === "low") {
    return byWidthAsc[0]?.link || null;
  }
  if (quality === "sd") {
    const sd = mp4Files.find((f: any) => f.quality === "sd");
    return (sd && sd.link) || byWidthAsc[0]?.link || mp4Files[0]?.link || null;
  }
  // hd
  const hd = mp4Files.find((f: any) => f.quality === "hd");
  return (hd && hd.link) || mp4Files[0]?.link || null;
}

// Mapea un video de Pexels a la forma esperada por Home
function mapPexelsVideoToMovieShape(video: any, opts: SourceSelectOptions = {}) {
  // Elegir una URL MP4, prefiriendo SD por defecto o usando opciones indicadas
  let source: string | null = null;
  const files = Array.isArray(video.video_files) ? video.video_files : [];
  const picked = selectBestSource(files, opts);
  if (typeof picked === "string") source = picked;

  const id = `px-${video.id}`; // namespacing para evitar colisiones con IDs propios
  const numericId = toNumericId(video.id);
  const title = video.user?.name
    ? `Video ${video.id} by ${video.user.name}`
    : `Video ${video.id}`;
  const director = typeof video.user?.name === "string" ? video.user.name : "Desconocido";
  const rating = deterministicRatingFromNumericId(numericId);
  const duration = typeof video.duration === "number"
    ? formatDuration(video.duration)
    : null;
  const genre = deterministicGenreFromNumericId(numericId);
  const description = video.url || `Pexels video ${video.id}`;
  const poster = video.image || video.video_pictures?.[0]?.picture || null;

  return { id, title, rating, duration, genre, description, poster, source, director };
}

/**
 * Devuelve videos populares de Pexels mapeados a la forma {id,title,rating,duration,genre,description,poster}
 */
export async function getPopularMoviesMapped(
  perPage = 10,
  opts: SourceSelectOptions = {},
  userId?: string,
) {
  const videos = await getPopularMovies(perPage);
  const mapped = videos.map((v: any) => mapPexelsVideoToMovieShape(v, opts));

  // Try to fetch any existing movies from our DB that match these Pexels IDs
  // so we can use the persisted average rating when available.
  try {
    const ids = mapped.map((m: any) => m.id).filter(Boolean);
    if (ids.length > 0) {
      const { data: dbMovies, error } = await supabase
        .from("movies")
        .select("id, rating")
        .in("id", ids as any[]);
      if (!error && Array.isArray(dbMovies)) {
        const ratingById: Record<string, number> = {};
        for (const r of dbMovies) {
          if (r && typeof r.id !== "undefined" && typeof r.rating === "number") {
            ratingById[String(r.id)] = Number(r.rating);
          }
        }
        // If a userId was provided, fetch user's own ratings for these movie ids
        const userRatingById: Record<string, number> = {};
        if (userId) {
          try {
            const { data: umData, error: umError } = await supabase
              .from('user_movies')
              .select('movie_id, rating')
              .eq('user_id', userId)
              .in('movie_id', ids as any[]);
            if (!umError && Array.isArray(umData)) {
              for (const u of umData) {
                if (u && typeof u.movie_id !== 'undefined' && typeof u.rating === 'number') {
                  userRatingById[String(u.movie_id)] = Number(u.rating);
                }
              }
            }
          } catch (e) {
            // ignore user rating merge failures
          }
        }
        // Override mapped rating with DB value when present
        return mapped.map((m: any) => ({
          ...m,
          rating: typeof ratingById[m.id] === "number" ? ratingById[m.id] : m.rating,
          userRating: typeof userRatingById[m.id] === 'number' ? userRatingById[m.id] : undefined,
        }));
      }
    }
  } catch (e) {
    // If DB lookup fails, fall back to deterministic mapping from Pexels
    // (don't crash the whole endpoint)
    console.warn("Warning: failed to merge DB ratings into Pexels mapped results:", e);
  }

  return mapped;
}

// Helper requested by frontend: fetches videos by genre and returns MovieSummary[]
export async function getMoviesByGenre(genre: string, perPage = 10): Promise<MovieSummary[]> {
  const videos = await searchMovies(genre, perPage);
  return videos.map((video: any) => {
    const id = `px-${video.id}`;
    const title = video.user?.name ? `Video ${video.id} by ${video.user.name}` : `Video ${video.id}`;
    const thumbnail_url = video.image || video.video_pictures?.[0]?.picture || undefined;
    const files = Array.isArray(video.video_files) ? video.video_files : [];
    const source = selectBestSource(files, { quality: "sd" }) || undefined;
    return { id, title, thumbnail_url, genre, source };
  });
}
