import jwt from "jsonwebtoken";

export async function authMiddleware(req, res, next) {
  try {
    if (!req.headers.authorization)
      return res
        .status(401)
        .json({ error: "Unauthorized, you are not logged in" });

    const token = req.headers.authorization.split(" ")[1];
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err)
        return res.status(401).json({ error: "Unauthorized, invalid token" });
      req.user = decoded; // Attach user info to request object
    });
    next();
  } catch (error) {
    return res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
}
