import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    buyerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    total: { type: Number, required: true },
    status: {
      type: String,
      enum: ["PENDING", "CONFIRMED", "DELIVERED", "CANCELLED", "COMPLETED"],
      default: "PENDING",
    },
    shippingInfo: {
      name: { type: String },
      address: { type: String },
      city: { type: String },
      phone: { type: String },
    },
    payment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },

  { timestamps: true }
);

orderSchema.index(
  { expireAt: 1 },
  {
    expireAfterSeconds: 0, // 1 minute
    partialFilterExpression: {
      status: { $in: ["PENDING"] },
    },
  }
);

const Order = mongoose.model("Order", orderSchema);
export default Order;
