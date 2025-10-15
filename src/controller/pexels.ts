import { Request, Response } from "express";
import { searchMovies, getPopularMovies } from "../services/pexels";

/**
 * Retrieves a list of popular videos from the Pexels API.
 * @async
 * @function getPopular
 * @param {Request} req - Express request object.
 * @param {Response} res - Express response object.
 * @returns {Promise<Response>} - Returns a JSON array of popular video objects.
 * 
 * @description
 * This function fetches a predefined number (10) of popular videos
 * from the Pexels API and returns them as JSON.
 * If an error occurs while fetching the data, it responds with HTTP 500.
 */
export async function getPopular(req: Request, res: Response) {
  try {
    const videos = await getPopularMovies(10);
    return res.status(200).json(videos);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

/**
 * Searches for videos on the Pexels API based on a query parameter.
 * @async
 * @function search
 * @param {Request} req - Express request object containing a `query` parameter in the URL.
 * @param {Response} res - Express response object.
 * @returns {Promise<Response>} - Returns a JSON array of video search results.
 * 
 * @description
 * This function:
 * 1. Validates that a search query was provided in the request.
 * 2. Calls the Pexels API to search for videos related to the given query.
 * 3. Returns the results as a JSON array.
 * 
 * If no query parameter is provided, it returns HTTP 400 with an error message.
 */
export async function search(req: Request, res: Response) {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({ error: "Search parameter is required" });
    }

    const videos = await searchMovies(query as string, 10);
    return res.status(200).json(videos);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
