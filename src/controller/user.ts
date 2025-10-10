import { Request, Response } from "express";
import {
  getUsers,
  createUser,
  getUserById,
  updateUser,
  deleteUser,
  getUserByEmail,
} from "../services/user";
import bcrypt from "bcryptjs";


export async function registerUser(req: Request, res: Response) {
  try {
    const { email, name, surname, age, password } = req.body;
    if (!email || !name || !surname || !age || !password) {
      return res.status(400).json({ error: "Faltan campos obligatorios" });
    }

    const newUser = await createUser(email, name, surname, age, password);
    return res.status(201).json(newUser);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
