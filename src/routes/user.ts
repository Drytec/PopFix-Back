import { Router } from "express";
import {
  registerUser,
  loginUser,
  getUserId,
  updateUserId,
  deleteUserId,
  getAllUsers,
  logoutUser,
  changePasswordUser,
} from "../controller/user";
import { authMiddleware } from "../middlewares/auth";

const router = Router();

router.get("/", getAllUsers);

router.post("/register", registerUser);

router.post("/login", loginUser);

// Logout (no auth required client-side; token is cleared on client)
router.post("/logout", logoutUser);

// Change password - protected route (uses token to identify user)
router.post("/change-password", authMiddleware, changePasswordUser);

router.get("/:id", getUserId);

router.put("/:id", updateUserId);

router.delete("/:id", deleteUserId);

export default router;
