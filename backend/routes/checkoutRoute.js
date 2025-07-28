import express from "express";
import { checkoutController } from "../controller/checkout/checkoutController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { initiatePayment } from "../controller/checkout/paymentController.js";

const router = express.Router();

router.use(authMiddleware); // Apply auth middleware to all routes in this router

router.route("/:id").post(checkoutController);
router.post("/online/initiate-payment", initiatePayment);

// router.post("/payment-status");

export default router;
