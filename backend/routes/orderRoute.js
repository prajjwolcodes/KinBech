import express from "express";

import { authMiddleware } from "../middleware/authMiddleware.js";
import {
  createOrder,
  getAllOrders,
  getBuyerOrders,
  getOrderById,
  getSellerOrders,
  updateOrderStatus,
} from "../controller/order/orderController.js";

const router = express.Router();

router.use(authMiddleware); // Apply auth middleware to all routes in this router

router.route("/").get(getAllOrders).post(createOrder);
// router.route("/:id").get(getOrderById);
router.route("/myorders").get(getBuyerOrders);

//seller
router.route("/update").post(updateOrderStatus);
router.route("/seller").get(getSellerOrders);

export default router;
