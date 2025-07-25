import express from "express";

import { authMiddleware } from "../middleware/authMiddleware.js";
import {
  createCategory,
  getAllCategories,
  updateCategory,
} from "../controller/category/categoryController.js";

const router = express.Router();

router.use(authMiddleware); // Apply auth middleware to all routes in this router

router.route("/").get(getAllCategories).post(createCategory);
router.route("/:id").patch(updateCategory);

export default router;
