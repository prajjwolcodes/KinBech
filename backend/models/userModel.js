import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String },
    role: {
      type: String,
      enum: ["buyer", "seller", "admin"],
      default: "buyer",
    },
    createdAt: { type: Date, default: Date.now },
  },
  { timeStamps: true }
);

const User = mongoose.model("User", userSchema);
export default User;
