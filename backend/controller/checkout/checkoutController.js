import axios from "axios";
import Order from "../../models/orderModel.js";
import OrderItem from "../../models/orderItemModel.js";
import Payment from "../../models/paymentModel.js";
import Product from "../../models/productModel.js";
import { generateHmacSha256Hash } from "../../utils/checkoutHelper.js";

export async function checkoutController(req, res) {
  try {
    const orderId = req.params.id;
    const { paymentMethod, shippingInfo, SUCCESS_URL, FAILURE_URL } = req.body;

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
      order.payment = payment;
      order.status = "CONFIRMED";
      await order.save();

      // Deduct stock
      await deductStock(orderId);

      // Populate items for frontend
      const items = await OrderItem.find({ orderId }).populate("productId");

      return res.json({
        status: "success",
        message: "Order confirmed with COD",
        data: {
          order,
          items,
          payment,
        },
      });
    }

    // ✅ Step 3: Handle Payment Gateway (Esewa/Khalti)
    if (paymentMethod === "ESEWA" || paymentMethod === "KHALTI") {
      // Otherwise initiate payment
      const paymentUrl = await initiateGatewayPayment(
        order,
        paymentMethod,
        SUCCESS_URL,
        FAILURE_URL
      );

      return res.json({
        data: {
          order,
          items: await OrderItem.find({ orderId }).populate("productId"),
        },
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
async function initiateGatewayPayment(
  order,
  paymentMethod,
  SUCCESS_URL,
  FAILURE_URL
) {
  let paymentConfig;

  let existingPayment = await Payment.findOne({
    orderId: order._id,
    method: paymentMethod,
  });

  // 2. If already paid, don't allow another
  if (existingPayment?.status === "PAID" || order.status !== "PENDING") {
    throw new Error("Payment already completed for this order.");
  }

  // 3. Reuse or generate new transaction UUID
  let transaction_uuid = existingPayment?.transaction_uuid;
  if (!transaction_uuid || existingPayment.status === "UNPAID") {
    transaction_uuid = `${order._id}-${Date.now()}`;
  }

  if (paymentMethod === "ESEWA") {
    const paymentData = {
      amount: order.total,
      product_delivery_charge: "0",
      product_service_charge: "0",
      product_code: process.env.ESEWA_MERCHANT_ID,
      signed_field_names: "total_amount,transaction_uuid,product_code",
      success_url: SUCCESS_URL,
      failure_url: FAILURE_URL,
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
  } else if (paymentMethod === "KHALTI") {
    paymentConfig = {
      url: process.env.KHALTI_PAYMENT_URL,
      data: {
        amount: order.total * 100, // paisa
        product_identity: order._id,
        product_name: `Order ${order._id}`,
        public_key: process.env.KHALTI_PUBLIC_KEY,
        return_url: SUCCESS_URL,
        failure_url: FAILURE_URL,

        website_url: process.env.FRONTEND_URL,
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
      method: paymentMethod,
      status: "UNPAID",
      transaction_uuid,
    });
  }

  return paymentUrl;
}

// Verify Esewa/Khalti payment

// ONLY RUNS AFTER PAYMENT GATEWAY CALLBACK ie frontend again calls this API with pidx/status after visiting success url
export async function verifyPayment(req, res) {
  try {
    const { orderId, transaction_uuid, amount, pidx } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const payment = await Payment.findOne({ orderId: order._id });
    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    const gateway = payment.method;

    if (gateway !== "ESEWA" && gateway !== "KHALTI") {
      return res.status(400).json({ message: "Invalid payment method" });
    }

    if (gateway === "ESEWA") {
      // Make sure required data is present
      if (!transaction_uuid || !amount) {
        return res
          .status(400)
          .json({ message: "Missing transaction data for Esewa" });
      }

      const response = await axios.get(
        process.env.ESEWA_PAYMENT_STATUS_CHECK_URL,
        {
          params: {
            product_code: process.env.ESEWA_MERCHANT_ID,
            total_amount: amount,
            transaction_uuid: transaction_uuid,
          },
        }
      );

      const paymentStatusCheck = response.data;

      if (paymentStatusCheck.status === "COMPLETE") {
        await finalizeOrder(order._id, "PAID", gateway); // pass order._id for consistency
        return res.status(200).json({
          message: "Esewa payment successful",
          status: "COMPLETED",
          order: order,
        });
      } else {
        await updatePayment(order._id, "UNPAID");
        return res.status(400).json({
          message: "Esewa payment failed",
          status: "FAILED",
        });
      }
    }

    if (gateway === "KHALTI") {
      if (!pidx) {
        return res.status(400).json({ message: "Missing pidx for Khalti" });
      }

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

      const paymentStatusCheck = response.data;

      if (paymentStatusCheck.status === "Completed") {
        await finalizeOrder(order._id, "PAID", gateway);
        return res.status(200).json({
          message: "Khalti payment successful",
          status: "COMPLETED",
          order: order,
        });
      } else {
        await updatePayment(order._id, "FAILED");
        return res.status(400).json({
          message: "Khalti payment failed",
          status: "FAILED",
        });
      }
    }
  } catch (error) {
    console.error("verifyPayment error:", error);
    return res.status(500).json({
      message: "Internal server error during payment verification",
      error: error.message || error.toString(),
    });
  }
}

// Finalize successful payment
async function finalizeOrder(order, paymentStatus, method) {
  await Payment.updateOne(
    { orderId: order._id },
    { $set: { status: paymentStatus, method } }
  );

  const payment = await Payment.findOne({ orderId: order._id });

  const existingOrder = await Order.findById(order._id);
  if (!existingOrder) {
    throw new Error("Order not found");
  }
  existingOrder.status = "CONFIRMED";
  existingOrder.payment = payment;
  await existingOrder.save();

  await deductStock(existingOrder._id);
}

// Update failed payment
async function updatePayment(order, status) {
  await Payment.updateOne({ orderId: order._id }, { $set: { status } });
}
