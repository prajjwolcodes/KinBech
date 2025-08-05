import User from "../../models/userModel.js";

export async function getAllUsers(req, res) {
  if (req.user.role !== "admin") {
    return res
      .status(403)
      .json({ message: "Access denied. Only admins can view all orders." });
  }

  try {
    const users = await User.find({}).select("-password").lean();
    res.status(200).json({ message: "All users fetched successfully", users });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
