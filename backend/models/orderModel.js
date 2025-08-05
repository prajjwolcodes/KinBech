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
    expireAt: { type: Date }, // field required for TTL
  },
  { timestamps: true }
);

// Set expireAt only for pending orders
orderSchema.pre("save", function (next) {
  if (this.status === "PENDING" && !this.expireAt) {
    this.expireAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes from now
  }
  next();
});

// TTL Index: deletes document once expireAt is reached
orderSchema.index(
  { expireAt: 1 },
  {
    expireAfterSeconds: 0,
    partialFilterExpression: { status: "PENDING" },
  }
);

const Order = mongoose.model("Order", orderSchema);
export default Order;
