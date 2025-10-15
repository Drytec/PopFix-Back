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

// Extiende la interfaz Request para incluir 'user'
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        [key: string]: any;
      };
    }
  }
}

export async function changePassword(req: Request, res: Response) {
  try {
    const userId = req.user?.id; // Asegúrate de tener auth middleware que ponga el id
    const { currentPassword, newPassword } = req.body;
    if (!userId || !currentPassword || !newPassword) {
      return res.status(400).json({ error: "Faltan campos obligatorios" });
    }
    const user = await getUserById(userId);
    if (!user) return res.status(404).json({ error: "Usuario no encontrado" });
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) return res.status(401).json({ error: "Contraseña actual incorrecta" });
    // Validaciones de seguridad para la nueva contraseña
    if (newPassword.length < 8) {
      return res.status(400).json({ error: "La nueva contraseña debe tener al menos 8 caracteres" });
    }
    const forbiddenPatterns = [
      /(\bSELECT\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b|\bDROP\b|\bCREATE\b)/i,
      /(\bUNION\b|\bOR\b.*=.*\b|\bAND\b.*=.*\b)/i,
      /['"`;\\]/g,
      /^\s+$/
    ];
    const hasForbiddenPattern = forbiddenPatterns.some(pattern => pattern.test(newPassword));
    if (hasForbiddenPattern) {
      return res.status(400).json({ error: "La nueva contraseña contiene caracteres o patrones no permitidos" });
    }
    if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(newPassword)) {
      return res.status(400).json({ error: "La nueva contraseña debe contener al menos una letra y un número" });
    }
    const hashed = await bcrypt.hash(newPassword, 10);
    await updateUser(userId, { password: hashed });
    return res.json({ message: "Contraseña actualizada correctamente" });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

export async function registerUser(req: Request, res: Response) {
  try {
    const { email, name, age, password } = req.body;

    // Validaciones básicas
    if (!email || !name || age === undefined || !password) {
      return res.status(400).json({ error: "Faltan campos obligatorios: name, email, age, password" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (typeof email !== "string" || !emailRegex.test(email)) {
      return res.status(400).json({ error: "Email inválido" });
    }

    if (typeof name !== "string" || name.trim().length === 0) {
      return res.status(400).json({ error: "Nombre inválido" });
    }

    const ageNum = Number(age);
    if (Number.isNaN(ageNum) || ageNum < 0 || ageNum > 120) {
      return res.status(400).json({ error: "Edad inválida" });
    }

    // Validaciones de seguridad para contraseñas
    const passwordStr =
      typeof password === "string"
        ? password
        : typeof password === "number"
        ? String(password)
        : null;

    if (!passwordStr || passwordStr.length < 8) {
      return res.status(400).json({ error: "La contraseña debe tener al menos 8 caracteres" });
    }

    // Prevenir contraseñas comunes y patrones de SQL injection
    const forbiddenPatterns = [
      /(\bSELECT\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b|\bDROP\b|\bCREATE\b)/i, // SQL keywords
      /(\bUNION\b|\bOR\b.*=.*\b|\bAND\b.*=.*\b)/i, // SQL injection patterns
      /['"`;\\]/g, // Caracteres peligrosos
      /^\s+$/ // Solo espacios en blanco
    ];

    const hasForbiddenPattern = forbiddenPatterns.some(pattern => pattern.test(passwordStr));
    if (hasForbiddenPattern) {
      return res.status(400).json({ 
        error: "La contraseña contiene caracteres o patrones no permitidos" 
      });
    }

    // Validar que tenga al menos una letra y un número para mayor seguridad
    if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(passwordStr)) {
      return res.status(400).json({ 
        error: "La contraseña debe contener al menos una letra y un número" 
      });
    }

    // Evitar emails duplicados
    const existing = await getUserByEmail(email);
    if (existing) {
      return res.status(409).json({ error: "El email ya está registrado" });
    }

    // Crear usuario solo con los campos permitidos
    const created = await createUser(email, name, ageNum, passwordStr);
    const safeUser = created
      ? { id: created.id, email: created.email, name: created.name, age: created.age }
      : null;
    return res.status(201).json(safeUser);
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
    const { password, ...safe } = user as any;
    return res.status(200).json(safe);
    }
    catch (err: any) {
        return res.status(500).json({ error: err.message });
      }
}

export async function updateUserId(req: Request, res: Response) {
    try{
        const {id} = req.params;
        const body = req.body || {};
        // Solo permitir actualizar estos campos
        const allowed: Record<string, any> = {};
        if (typeof body.name === "string") allowed.name = body.name;
        if (typeof body.email === "string") allowed.email = body.email;
        if (body.age !== undefined) {
          const ageNum = Number(body.age);
          if (!Number.isNaN(ageNum)) allowed.age = ageNum;
        }
        // Validaciones de seguridad para contraseñas en actualización
        if (body.password !== undefined) {
          const passwordStr =
            typeof body.password === "string"
              ? body.password
              : typeof body.password === "number"
              ? String(body.password)
              : null;

          if (passwordStr && passwordStr.length > 0) {
            // Validar longitud mínima
            if (passwordStr.length < 8) {
              return res.status(400).json({ error: "La contraseña debe tener al menos 8 caracteres" });
            }

            // Prevenir contraseñas comunes y patrones de SQL injection
            const forbiddenPatterns = [
              /(\bSELECT\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b|\bDROP\b|\bCREATE\b)/i, // SQL keywords
              /(\bUNION\b|\bOR\b.*=.*\b|\bAND\b.*=.*\b)/i, // SQL injection patterns
              /['"`;\\]/g, // Caracteres peligrosos
              /^\s+$/ // Solo espacios en blanco
            ];

            const hasForbiddenPattern = forbiddenPatterns.some(pattern => pattern.test(passwordStr));
            if (hasForbiddenPattern) {
              return res.status(400).json({ 
                error: "La contraseña contiene caracteres o patrones no permitidos" 
              });
            }

            // Validar que tenga al menos una letra y un número para mayor seguridad
            if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(passwordStr)) {
              return res.status(400).json({ 
                error: "La contraseña debe contener al menos una letra y un número" 
              });
            }

            allowed.password = passwordStr; // será hasheada en el servicio
          }
        }

        const updatedUser = await updateUser(id, allowed);
        if(!id){
            return res.status(404).json({error: "Usuario no encontrado"});
        }
        if (!updatedUser){
            return res.status(400).json({error: "Actualizacion Fallida"});
        }
        const { password, ...safe } = updatedUser as any;
        return res.status(200).json(safe);
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

export async function getAllUsers(req: Request, res: Response) {
  try {
    const users = await getUsers();
    const safe = (users || []).map((u: any) => {
      const { password, ...rest } = u || {};
      return rest;
    });
    return res.status(200).json(safe);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  } 
}