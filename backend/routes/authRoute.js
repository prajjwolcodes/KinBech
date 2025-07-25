import express from "express";
import { signupController } from "../controller/auth/signupController.js";
import {
  loginController,
  logoutController,
} from "../controller/auth/loginController.js";
import { googleLogin } from "../controller/auth/googleAuthController.js";

const router = express.Router();

router.route("/signup").post(signupController);
router.route("/login").post(loginController);
router.route("/logout").post(logoutController);
router.route("/google").post(googleLogin);

export default router;
