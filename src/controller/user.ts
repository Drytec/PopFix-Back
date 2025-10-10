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
import { verifyToken, generateToken } from "../services/auth"; 

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

export async function loginUser(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ error: "Email y contraseña requeridos" });
       const user = await getUserByEmail(email);
    if (!user) return res.status(404).json({ error: "Usuario no encontrado" });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword)
      return res.status(401).json({ error: "Contraseña incorrecta" });

    const token = generateToken({
      id: user.id,
      email: user.email,
      name: user.name,
    });

    return res.status(200).json({
      message: "Login exitoso",
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

export async function getUserId(req: Request, res: Response) {
    try{
        const {id} = req.params;
        const user = await getUserById(id);
        if(!user){
            return res.status(404).json({error: "Usuario no encontrado"});
        }
        return res.status(200).json(user);
    }
    catch (err: any) {
        return res.status(500).json({ error: err.message });
      }
}

export async function updateUserId(req: Request, res: Response) {
    try{
        const {id} = req.params;
        const updates = req.body;
        const updatedUser = await updateUser(id, updates);
        if(!id){
            return res.status(404).json({error: "Usuario no encontrado"});
        }
        if (!updatedUser){
            return res.status(400).json({error: "Actualizacion Fallida"});
        }
        return res.status(200).json(updatedUser);
    }
    catch (err: any) {
        return res.status(500).json({ error: err.message });
      }
}
export async function deleteUserId(req: Request, res: Response) {
    try{
        const {id} = req.params;
        const getUser = await getUserById(id);
        if(!getUser){
            return res.status(404).json({error: "Usuario no encontrado"});
        }
        const user = await deleteUser(id);
        return res.status(200).json({message: "Usuario eliminado correctamente" });


    }
    catch (err: any) {
        return res.status(500).json({ error: err.message });
      }
    }