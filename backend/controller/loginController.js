import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import User from "../models/userModel.js";
import { client } from "../index.js";

export async function loginController(req, res) {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({
      message: "Provide all the data",
    });

  const user = await User.findOne({ email });

  if (!user) {
    return res.status(400).json({
      message: "Not registered with that email",
    });
  }

  if (!user.password) {
    return res.status(400).json({
      message: "You are registered with Google, please login with Google",
    });
  }

  const passwordMatch = bcrypt.compareSync(password, user.password);
  if (passwordMatch) {
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      {
        expiresIn: "30d",
      }
    );
    return res.status(200).json({
      message: "You are successfully Logged in",
      token,
      user,
    });
  } else {
    return res.status(400).json({
      message: "Invalid password",
    });
  }
}

export const logoutController = async (req, res) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorzed" });
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) return res.status(401).json({ error: "Unauthorized" });
    });
    res.json({ message: "Logout successfully" });
  } catch (error) {
    return res
      .status(500)
      .json({ error: "Login failed", details: error.message });
  }
};
