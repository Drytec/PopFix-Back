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
    const { email, name, surname, age, password } = req.body;
    if (!email || !name || !surname || !age || !password) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const newUser = await createUser(email, name, surname, age, password);
    return res.status(201).json(newUser);
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
      return res.status(404).json({ error: "User not found" });
    }
    return res.status(200).json(user);
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
    const updates = req.body;
    const updatedUser = await updateUser(id, updates);
    if (!id) {
      return res.status(404).json({ error: "User not found" });
    }
    if (!updatedUser) {
      return res.status(400).json({ error: "Update failed" });
    }
    return res.status(200).json(updatedUser);
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
    return res.status(200).json(users);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
