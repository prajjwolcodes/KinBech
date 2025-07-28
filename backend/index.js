import express from "express";
import cors from "cors";
import path from "path";
import { configDotenv } from "dotenv";
import Dbconnect from "./database/dbController.js";
import { OAuth2Client } from "google-auth-library";
import User from "./models/userModel.js";

// Importing routes
import productRoutes from "./routes/productRoute.js";
import authRoutes from "./routes/authRoute.js";
import categoryRoutes from "./routes/categoryRoute.js";
import orderRoutes from "./routes/orderRoute.js";
import checkoutRoutes from "./routes/checkoutRoute.js";

configDotenv();

Dbconnect();

const app = express();

app.use(
  express.json({
    limit: "5mb",
  })
);
app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  next();
});
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: "*",
    credentials: true,
  })
);

export const client = new OAuth2Client(
  process.env.BACKEND_GOOGLE_CLIENT_ID,
  process.env.BACKEND_GOOGLE_CLIENT_SECRET,
  "postmessage" // This indicates we're using the "postmessage" flow, common with frontend libraries
);

// Importing routes

app.use("/api/auth", authRoutes);
app.use("/api/product", productRoutes);
app.use("/api/category", categoryRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/checkout", checkoutRoutes);

app.get("/", async (req, res) => {
  const users = await User.find();
  res.json(users);
});

const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log("Server running at port", PORT);
});
