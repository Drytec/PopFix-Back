import { Request, Response } from "express";
import { searchMovies, getPopularMovies } from "../services/pexels";

export async function getPopular(req: Request, res: Response) {
  try {
    const videos = await getPopularMovies(10);
    return res.status(200).json(videos);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function search(req: Request, res: Response) {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ error: "Debe enviar un parámetro de búsqueda" });
    }

    const videos = await searchMovies(query as string, 10);
    return res.status(200).json(videos);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
