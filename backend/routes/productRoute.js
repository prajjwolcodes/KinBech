import express from "express";

import {
  createProduct,
  getAllProducts,
  getProductById,
  getProductsByCategory,
  getProductsBySeller,
  updateProduct,
} from "../controller/product/productController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { upload } from "../middleware/upload.js";

const router = express.Router();

router.use(authMiddleware); // Apply auth middleware to all routes in this router

router
  .route("/")
  .get(getAllProducts)
  .post(upload.single("image"), createProduct);
router.route("/seller").get(getProductsBySeller);
router.route("/update").get(updateProduct);
router.route("/category/:categoryId").get(getProductsByCategory);
router.route("/:id").get(getProductById);

export default router;
