import axios from "axios";
import Order from "../../models/orderModel.js";
import OrderItem from "../../models/orderItemModel.js";
import Payment from "../../models/paymentModel.js";
import Product from "../../models/productModel.js";
import { generateHmacSha256Hash } from "../../utils/checkoutHelper.js";

export async function checkoutController(req, res) {
  try {
    const orderId = req.params.id;
    const { paymentMethod, shippingInfo, pidx, status } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    if (!paymentMethod || !shippingInfo) {
      return res.status(400).json({ message: "All fields are required." });
    }

    // ✅ Step 1: Update shipping info
    await Order.updateOne({ _id: orderId }, { $set: { shippingInfo } });

    // ✅ Step 2: Handle COD
    if (paymentMethod === "COD") {
      const payment = await Payment.create({
        orderId,
        amount: order.total,
        method: "COD",
        status: "UNPAID",
      });

      order.status = "CONFIRMED";
      await order.save();

      // Deduct stock
      await deductStock(orderId);

      return res.json({ payment, message: "Order confirmed with COD" });
    }

    // ✅ Step 3: Handle Payment Gateway (Esewa/Khalti)
    if (paymentMethod === "ESEWA" || paymentMethod === "KHALTI") {
      // If callback received (status check)
      if (pidx || status) {
        const paymentUpdate = await verifyPayment(
          order,
          paymentMethod,
          pidx,
          status
        );
        return res.json(paymentUpdate);
      }

      // Otherwise initiate payment
      const paymentUrl = await initiateGatewayPayment(order, paymentMethod);
      return res.json({
        url: paymentUrl,
        message: "Redirect to payment gateway",
      });
    }

    return res.status(400).json({ message: "Invalid payment method" });
  } catch (error) {
    console.error("Checkout error:", error);
    res
      .status(500)
      .json({ message: error.message || "Internal server error on checkout" });
  }
}

/* ---------- Helpers ---------- */

// Deduct stock from all products in order
async function deductStock(orderId) {
  const orderItems = await OrderItem.find({ orderId }).populate("productId");

  await Promise.all(
    orderItems.map(async (item) => {
      const product = item.productId;
      if (!product) return;

      if (product.count < item.quantity) {
        throw new Error(`Not enough stock for product ${product.name}`);
      }

      product.count -= item.quantity;
      await product.save();
    })
  );
}

// Initiate Esewa/Khalti payment
async function initiateGatewayPayment(order, gateway) {
  let paymentConfig;

  let existingPayment = await Payment.findOne({
    orderId: order._id,
    method: "ESEWA",
  });

  // 2. If already paid, don't allow another
  if (existingPayment?.status === "PAID" || order.status !== "PENDING") {
    throw new Error("Payment already completed for this order.");
  }

  // 3. Reuse or generate new transaction UUID
  let transaction_uuid = existingPayment?.transaction_uuid;
  if (!transaction_uuid || existingPayment.status === "FAILED") {
    transaction_uuid = `${order._id}-${Date.now()}`;
  }

  if (gateway === "ESEWA") {
    const paymentData = {
      amount: order.total,
      failure_url: process.env.FAILURE_URL,
      product_delivery_charge: "0",
      product_service_charge: "0",
      product_code: process.env.ESEWA_MERCHANT_ID,
      signed_field_names: "total_amount,transaction_uuid,product_code",
      success_url: process.env.SUCCESS_URL,
      tax_amount: "0",
      total_amount: order.total,
      transaction_uuid,
    };

    const data = `total_amount=${paymentData.total_amount},transaction_uuid=${paymentData.transaction_uuid},product_code=${paymentData.product_code}`;
    const signature = generateHmacSha256Hash(data, process.env.ESEWA_SECRET);

    paymentConfig = {
      url: process.env.ESEWA_PAYMENT_URL,
      data: { ...paymentData, signature },
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      responseHandler: (response) => response.request?.res?.responseUrl,
    };
  } else if (gateway === "KHALTI") {
    paymentConfig = {
      url: process.env.KHALTI_PAYMENT_URL,
      data: {
        amount: order.total * 100, // paisa
        product_identity: order._id,
        product_name: `Order ${order._id}`,
        public_key: process.env.KHALTI_PUBLIC_KEY,
        return_url: process.env.KHALTI_SUCCESS_URL,
        failure_url: process.env.KHALTI_FAILURE_URL,

        website_url: "http://localhost:5173",
        purchase_order_id: order._id,
        purchase_order_name: `Order ${order._id}`,
      },
      headers: {
        Authorization: `Key ${process.env.KHALTI_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      responseHandler: (response) => response.data?.payment_url,
    };
  }

  const payment = await axios.post(paymentConfig.url, paymentConfig.data, {
    headers: paymentConfig.headers,
  });

  const paymentUrl = paymentConfig.responseHandler(payment);
  if (!paymentUrl) {
    throw new Error("Payment URL missing from gateway response");
  }

  if (existingPayment) {
    existingPayment.transaction_uuid = transaction_uuid;
    existingPayment.status = "UNPAID";
    await existingPayment.save();
  } else {
    await Payment.create({
      orderId: order._id,
      amount: order.total,
      method: "ESEWA",
      status: "UNPAID",
      transaction_uuid,
    });
  }

  return paymentUrl;
}

// Verify Esewa/Khalti payment

// ONLY RUNS AFTER PAYMENT GATEWAY CALLBACK ie frontend again calls this API with pidx/status after visiting success url
async function verifyPayment(order, gateway, pidx, status) {
  let paymentStatusCheck;

  if (gateway === "ESEWA") {
    const response = await axios.get(
      process.env.ESEWA_PAYMENT_STATUS_CHECK_URL,
      {
        params: {
          product_code: process.env.ESEWA_MERCHANT_ID,
          total_amount: order.total,
          transaction_uuid: order._id.toString(),
        },
      }
    );

    paymentStatusCheck = response.data;

    if (paymentStatusCheck.status === "COMPLETE") {
      await finalizeOrder(order, "PAID", gateway);
      return { message: "Esewa payment successful", status: "COMPLETED" };
    } else {
      await updatePayment(order._id, "FAILED");
      return { message: "Esewa payment failed", status: "FAILED" };
    }
  }

  if (gateway === "KHALTI") {
    const response = await axios.post(
      process.env.KHALTI_VERIFICATION_URL,
      { pidx },
      {
        headers: {
          Authorization: `Key ${process.env.KHALTI_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    paymentStatusCheck = response.data;

    if (paymentStatusCheck.status === "Completed") {
      await finalizeOrder(order, "PAID", gateway);
      return { message: "Khalti payment successful", status: "COMPLETED" };
    } else {
      await updatePayment(order._id, "FAILED");
      return { message: "Khalti payment failed", status: "FAILED" };
    }
  }
}

// Finalize successful payment
async function finalizeOrder(order, paymentStatus, method) {
  await Payment.updateOne(
    { orderId: order._id },
    { $set: { status: paymentStatus, method } }
  );

  order.status = "CONFIRMED";
  await order.save();

  await deductStock(order._id);
}

// Update failed payment
async function updatePayment(orderId, status) {
  await Payment.updateOne({ orderId }, { $set: { status } });
}
