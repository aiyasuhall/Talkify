import express from "express";
import {
  authMe,
  searchUserByUsername,
  uploadAvatar,
  updateProfile,
  updatePreferences,
  changePassword,
  blockUser,
  unblockUser,
  getBlockedUsers,
  deleteAccount
} from "../controllers/userController.js";
import { upload } from "../middlewares/uploadMiddleware.js";

const router = express.Router();

router.get("/me", authMe);
router.get("/search", searchUserByUsername);

router.post("/uploadAvatar", upload.single("file"), uploadAvatar);

router.patch("/profile", updateProfile);
router.patch("/preferences", updatePreferences);
router.patch("/password", changePassword);

router.get("/blocked", getBlockedUsers);
router.post("/block/:targetUserId", blockUser);
router.delete("/block/:targetUserId", unblockUser);

router.delete("/account", deleteAccount);

export default router;