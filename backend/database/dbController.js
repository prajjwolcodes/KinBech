import mongoose from "mongoose";

export default async function Dbconnect() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Database Connected");
  } catch (error) {
    console.error("Database connection error:", error);
  }
}
