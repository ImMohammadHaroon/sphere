import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import * as userController from "../controllers/user.controller.js";

const router = Router();

router.get("/:userId/avatar", authenticate, userController.getUserAvatar);

export default router;
