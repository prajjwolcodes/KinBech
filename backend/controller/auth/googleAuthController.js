import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import User from "../../models/userModel.js";

const client = new OAuth2Client(process.env.GOOGLE_GOOGLE_CLIENT_ID);

async function verifyGoogleToken(idToken) {
  try {
    const ticket = await client.verifyIdToken({
      idToken: idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    return payload; // Contains user info like email, name, sub (Google ID)
  } catch (error) {
    console.error("Error verifying Google ID token:", error);
    return null;
  }
}

// Conceptual controller function
export const googleLogin = async (req, res) => {
  const { idToken, role } = req.body;

  if (!idToken) {
    return res.status(400).json({ message: "Google ID token is required." });
  }

  const googleUserPayload = await verifyGoogleToken(idToken);

  if (!googleUserPayload) {
    return res.status(401).json({ message: "Invalid Google ID token." });
  }

  try {
    const { name, email } = googleUserPayload;

    const userExists = await User.findOne({ email });

    if (userExists && userExists.password) {
      return res.status(400).json({
        message:
          "You are registered with email and password, please login with email and password",
      });
    }

    if (userExists) {
      const token = jwt.sign(
        { _id: userExists._id, role: userExists.role, email, name },
        process.env.JWT_SECRET,
        {
          expiresIn: "1h",
        }
      );
      return res.status(200).json({
        message: "You are successfully logged in",
        token,
        user: userExists,
      });
    } else {
      // Create a new user
      const newUser = new User({
        email,
        username: name,
        role: role || "buyer",
        password: null,
      });
      await newUser.save();

      const token = jwt.sign(
        { _id: newUser._id, role: newUser.role, email, name },
        process.env.JWT_SECRET,
        {
          expiresIn: "1h",
        }
      );
      return res.status(201).json({
        message: "User created successfully",
        token,
        user: newUser,
      });
    }
  } catch (error) {
    console.error("Error during login process:", error);
    res.status(500).json({ message: "Internal server error during login." });
  }
};
