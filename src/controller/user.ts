import { Request, Response } from "express";
import {
  getUsers,
  createUser,
  getUserById,
  updateUser,
  deleteUser,
  getUserByEmail,
  changePassword,
} from "../services/user";
import bcrypt from "bcryptjs";
import { verifyToken, generateToken } from "../services/auth";

/**
 * Registers a new user in the system.
 * @async
 * @function registerUser
 * @param {Request} req - Express request object containing user data in the body.
 * @param {Response} res - Express response object.
 * @returns {Promise<Response>} - Returns the created user or an error message.
 */
export async function registerUser(req: Request, res: Response) {
  try {
    const { email, name, age, password } = req.body;

    if (!email || !name || age === undefined || !password) {
      return res.status(400).json({
        error: "Faltan campos obligatorios: name, email, age, password",
      });
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

    const passwordStr =
      typeof password === "string"
        ? password
        : typeof password === "number"
          ? String(password)
          : null;

    if (!passwordStr || passwordStr.length < 8) {
      return res
        .status(400)
        .json({ error: "La contraseña debe tener al menos 8 caracteres" });
    }

    const forbiddenPatterns = [
      /(\bSELECT\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b|\bDROP\b|\bCREATE\b)/i, // SQL keywords
      /(\bUNION\b|\bOR\b.*=.*\b|\bAND\b.*=.*\b)/i, // SQL injection patterns
      /['"`;\\]/g,
      /^\s+$/,
    ];

    const hasForbiddenPattern = forbiddenPatterns.some((pattern) =>
      pattern.test(passwordStr),
    );
    if (hasForbiddenPattern) {
      return res.status(400).json({
        error: "La contraseña contiene caracteres o patrones no permitidos",
      });
    }

    if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(passwordStr)) {
      return res.status(400).json({
        error: "La contraseña debe contener al menos una letra y un número",
      });
    }

    const existing = await getUserByEmail(email);
    if (existing) {
      return res.status(409).json({ error: "El email ya está registrado" });
    }

    const created = await createUser(email, name, ageNum, passwordStr);
    const safeUser = created
      ? {
          id: created.id,
          email: created.email,
          name: created.name,
          age: created.age,
        }
      : null;
    return res.status(201).json(safeUser);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

/**
 * Authenticates a user and generates a JWT token.
 * @async
 * @function loginUser
 * @param {Request} req - Express request object containing login credentials.
 * @param {Response} res - Express response object.
 * @returns {Promise<Response>} - Returns a JWT token and user data if successful.
 */
export async function loginUser(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ error: "Email and password are required" });

    const user = await getUserByEmail(email);
    if (!user) return res.status(404).json({ error: "User not found" });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword)
      return res.status(401).json({ error: "Incorrect password" });

    const token = generateToken({
      id: user.id,
      email: user.email,
      name: user.name,
    });

    return res.status(200).json({
      message: "Login successful",
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

/**
 * Retrieves a user by their ID.
 * @async
 * @function getUserId
 * @param {Request} req - Express request object containing user ID as a parameter.
 * @param {Response} res - Express response object.
 * @returns {Promise<Response>} - Returns the user data if found.
 */
export async function getUserId(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const user = await getUserById(id);
    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }
    const { password, ...safe } = user as any;
    return res.status(200).json(safe);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

/**
 * Updates a user’s information by ID.
 * @async
 * @function updateUserId
 * @param {Request} req - Express request object containing user ID as a parameter and updated data in the body.
 * @param {Response} res - Express response object.
 * @returns {Promise<Response>} - Returns the updated user data.
 */
export async function updateUserId(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const body = req.body || {};

    const allowed: Record<string, any> = {};
    if (typeof body.name === "string") allowed.name = body.name;
    if (typeof body.email === "string") allowed.email = body.email;
    if (body.age !== undefined) {
      const ageNum = Number(body.age);
      if (!Number.isNaN(ageNum)) allowed.age = ageNum;
    }

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
          return res
            .status(400)
            .json({ error: "La contraseña debe tener al menos 8 caracteres" });
        }

        const forbiddenPatterns = [
          /(\bSELECT\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b|\bDROP\b|\bCREATE\b)/i, // SQL keywords
          /(\bUNION\b|\bOR\b.*=.*\b|\bAND\b.*=.*\b)/i, // SQL injection patterns
          /['"`;\\]/g,
          /^\s+$/,
        ];

        const hasForbiddenPattern = forbiddenPatterns.some((pattern) =>
          pattern.test(passwordStr),
        );
        if (hasForbiddenPattern) {
          return res.status(400).json({
            error: "La contraseña contiene caracteres o patrones no permitidos",
          });
        }

        if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(passwordStr)) {
          return res.status(400).json({
            error: "La contraseña debe contener al menos una letra y un número",
          });
        }

        allowed.password = passwordStr;
      }
    }

    const updatedUser = await updateUser(id, allowed);
    if (!id) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }
    if (!updatedUser) {
      return res.status(400).json({ error: "Actualizacion Fallida" });
    }
    const { password, ...safe } = updatedUser as any;
    return res.status(200).json(safe);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

/**
 * Deletes a user by their ID.
 * @async
 * @function deleteUserId
 * @param {Request} req - Express request object containing user ID as a parameter.
 * @param {Response} res - Express response object.
 * @returns {Promise<Response>} - Returns a success message if deletion is successful.
 */
export async function deleteUserId(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const getUser = await getUserById(id);
    if (!getUser) {
      return res.status(404).json({ error: "User not found" });
    }
    await deleteUser(id);
    return res.status(200).json({ message: "User deleted successfully" });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

/**
 * Retrieves all users from the system.
 * @async
 * @function getAllUsers
 * @param {Request} req - Express request object.
 * @param {Response} res - Express response object.
 * @returns {Promise<Response>} - Returns a list of all registered users.
 */
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
export async function logoutUser(req: Request, res: Response) {
  try {
    return res.status(200).json({ message: "Logout successful" });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
export async function changePasswordUser(req: Request, res: Response) {
  try {
    // Obtener id del parámetro o del token (establecido por authMiddleware)
  const { id: paramId } = req.params;
  const { oldPassword, currentPassword, newPassword } = req.body || {};
  const oldPasswordVal = oldPassword || currentPassword;
  const newPasswordVal = newPassword;
  const id = paramId || (req as any).user?.id;
    const user = await getUserById(id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    if (!oldPasswordVal || !newPasswordVal) {
      return res
        .status(400)
        .json({ error: "Old and new passwords are required" });
    }
    const newPwd = await changePassword(id, oldPasswordVal, newPasswordVal);
    if (!newPwd) {
      return res.status(400).json({ error: "Password change failed" });
    }
    return res.status(200).json({ message: "Password changed successfully" });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
