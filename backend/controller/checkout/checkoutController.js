import OrderItem from "../../models/orderItemModel.js";
import Order from "../../models/orderModel.js";
import Payment from "../../models/paymentModel.js";
import Product from "../../models/productModel.js";

export async function checkoutController(req, res) {
  try {
    const orderId = req.params.id;
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }
    const { paymentMethod, paymentStatus, shippingInfo } = req.body;

    await Order.updateOne(
      { _id: orderId },
      { $set: { shippingInfo, status: "CONFIRMED" } }
    );

    const orderItems = await OrderItem.find({ orderId: orderId }).populate(
      "productId"
    );
    console.log(orderItems);

    await Promise.all(
      orderItems.map(async (item) => {
        const product = item.productId;

        if (!product) return; // safety check if product is missing

        if (product.count < item.quantity) {
          throw new Error(`Not enough stock for product ${product.name}`);
        }

        // Deduct count
        product.count -= item.quantity;
        await product.save();
      })
    );

    if (!paymentMethod || !shippingInfo) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const payment = await Payment.create({
      orderId: orderId,
      amount: order.total,
      method: paymentMethod,
      status: paymentStatus,
    });

    // Checkout logic goes here
    res.json({ payment, message: "Checkout successful" });
  } catch (error) {
    console.error("Checkout error:", error);
    res
      .status(500)
      .json({ message: error.message || "Internal server error on checkout" });
  }
}
