import express from "express";

import { authMiddleware } from "../middleware/authMiddleware.js";
import {
  cancelOrder,
  createOrder,
  getAllOrders,
  getBuyerOrders,
  getOrderById,
  getSellerOrders,
  updateOrderStatus,
  updatePaymentStatus,
} from "../controller/order/orderController.js";

const router = express.Router();

router.use(authMiddleware); // Apply auth middleware to all routes in this router

router.route("/").get(getAllOrders).post(createOrder);
router.route("/single/:id").get(getOrderById);
router.route("/myorders").get(getBuyerOrders);

//seller
router.route("/update/:id").post(updateOrderStatus);
router.route("/updatepayment/:id").post(updatePaymentStatus);
router.route("/seller").get(getSellerOrders);
router.route("/cancel").get(cancelOrder);

export default router;
