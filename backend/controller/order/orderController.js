import OrderItem from "../../models/orderItemModel.js";
import Order from "../../models/orderModel.js";
import Product from "../../models/productModel.js";
import mongoose from "mongoose";

export async function createOrder(req, res) {
  const buyerId = req.user._id;
  if (req.user.role !== "buyer") {
    return res
      .status(403)
      .json({ message: "Access denied. Only buyers can create orders." });
  }
  const { items } = req.body; // items = [{ productId, quantity }]

  if (!Array.isArray(items) || items.length === 0) {
    return res
      .status(400)
      .json({ status: "error", message: "Items are required" });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Fetch all product data
    const productIds = items.map((i) => i.productId);
    const products = await Product.find({ _id: { $in: productIds } }).session(
      session
    );

    const orderItems = [];
    let total = 0;

    for (const item of items) {
      const product = products.find((p) => p._id.toString() === item.productId);
      if (!product) throw new Error(`Product ${item.productId} not found`);

      // 2. Check stock availability
      if (product.count < item.quantity) {
        throw new Error(`Insufficient stock for ${product.name}`);
      }

      // 4. Prepare order item
      orderItems.push({
        orderId: null, // set after order is created
        productId: product._id,
        price: product.price,
        quantity: item.quantity,
        sellerId: product.sellerId, // assuming product has sellerId
      });

      total += product.price * item.quantity;
    }

    // 5. Create order
    const expireAt = new Date(Date.now() + 1 * 60 * 1000);

    const [order] = await Order.create([{ buyerId, total, expireAt }], {
      session,
    });

    // 6. Add orderId and insert order items
    orderItems.forEach((i) => (i.orderId = order._id));
    await OrderItem.insertMany(orderItems, { session });

    await session.commitTransaction();
    session.endSession();

    // 7. Return order with populated items
    const populatedItems = await OrderItem.find({
      orderId: order._id,
    }).populate("productId");

    res.status(201).json({
      status: "success",
      message: "Order created successfully",
      data: { order, items: populatedItems },
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error(err);
    res
      .status(500)
      .json({ status: "error", message: err.message || "Internal error" });
  }
}

export async function getOrderById(req, res) {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res
      .status(400)
      .json({ status: "error", message: "Invalid Order ID" });
  }

  try {
    const order = await Order.findById(id).lean();
    if (!order) {
      return res
        .status(404)
        .json({ status: "error", message: "Order not found" });
    }

    const items = await OrderItem.find({ orderId: id })
      .populate("productId", "title price")
      .lean();

    res.json({
      status: "success",
      message: "Order retrieved",
      data: { order, items },
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
}

export async function getBuyerOrders(req, res) {
  if (req.user.role !== "buyer") {
    return res
      .status(403)
      .json({ message: "Access denied. Only buyers can view their orders." });
  }
  const buyerId = req.user._id;

  try {
    const orders = await Order.find({ buyerId }).sort({ createdAt: -1 }).lean();
    const orderIds = orders.map((o) => o._id);
    const items = await OrderItem.find({ orderId: { $in: orderIds } })
      .populate("productId", "title price")
      .lean();

    const ordersWithItems = orders.map((order) => ({
      ...order,
      items: items.filter((i) => i.orderId.toString() === order._id.toString()),
    }));

    res.json({
      status: "success",
      message: "Buyer orders retrieved",
      data: { orders: ordersWithItems },
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
}

export async function getAllOrders(req, res) {
  if (req.user.role !== "admin") {
    return res
      .status(403)
      .json({ message: "Access denied. Only admins can view all orders." });
  }
  try {
    const orders = await Order.find().sort({ createdAt: -1 }).lean();

    const orderIds = orders.map((o) => o._id);
    const items = await OrderItem.find({ orderId: { $in: orderIds } })
      .populate("productId", "title price")
      .lean();

    const ordersWithItems = orders.map((order) => ({
      ...order,
      items: items.filter((i) => i.orderId.toString() === order._id.toString()),
    }));

    res.json({
      status: "success",
      message: "All orders retrieved",
      data: { orders: ordersWithItems },
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
}

// Seller POV: list only orders containing their products
export async function getSellerOrders(req, res) {
  if (req.user.role !== "seller") {
    return res
      .status(403)
      .json({ message: "Access denied. Only sellers can view their orders." });
  }
  const sellerId = req.user._id;

  try {
    const sellerProducts = await Product.find({ sellerId })
      .select("_id title")
      .lean();
    const productIds = sellerProducts.map((p) => p._id);

    const items = await OrderItem.find({ productId: { $in: productIds } })
      .populate("orderId")
      .populate("productId", "title")
      .lean();

    const grouped = items.reduce((acc, item) => {
      const orderId = item.orderId._id.toString();
      if (!acc[orderId]) {
        acc[orderId] = {
          ...item.orderId,
          items: [],
        };
      }
      acc[orderId].items.push({
        productId: item.productId._id,
        title: item.productId.title,
        quantity: item.quantity,
        price: item.price,
      });
      return acc;
    }, {});

    const orders = Object.values(grouped);
    res.json({
      status: "success",
      message: "Seller orders retrieved",
      data: { orders },
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
}

export async function updateOrderStatus(req, res) {
  if (req.user.role !== "seller" && req.user.role !== "admin") {
    return res.status(403).json({
      message: "Access denied. Only sellers and admin can update order status.",
    });
  }
  const { id } = req.params;
  const { status } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id) || !status) {
    return res
      .status(400)
      .json({ status: "error", message: "Order ID and status required" });
  }

  try {
    const order = await Order.findById(id);
    if (!order) {
      return res
        .status(404)
        .json({ status: "error", message: "Order not found" });
    }

    // Optional: Restrict only sellers of the products to update status
    // Add logic here if needed

    order.status = status;
    await order.save();

    res.json({
      status: "success",
      message: "Order status updated",
      data: { order },
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
}

export async function cancelOrder(req, res) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const orderId = req.params.id;

    const orderItems = await OrderItem.find({ orderId })
      .populate("productId")
      .session(session);

    // Restore product stock
    for (const item of orderItems) {
      const product = item.productId;
      product.count += item.quantity;
      await product.save({ session });
    }

    // Optionally update order status or delete it
    // await Order.findByIdAndUpdate(orderId, { status: "CANCELLED" }, { session });

    await session.commitTransaction();
    session.endSession();

    res.json({ message: "Order canceled and stock restored." });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    res.status(400).json({ error: err.message });
  }
}
