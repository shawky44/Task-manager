import jwt from "jsonwebtoken";

export const identifier = (req, res, next) => {
  try {
    let token;

    if (req.headers.client === "not-browser") {
      token = req.headers.authorization;
    } else {
      token = req.cookies["Authorization"];
    }

    if (!token) {
      return res.status(403).json({ success: false, message: "Unauthorized: No token provided" });
    }

    // Remove Bearer if exists
    const userToken = token.startsWith("Bearer ") ? token.split(" ")[1] : token;

    const jwtverified = jwt.verify(userToken, process.env.TOKEN_SECRET);

    req.user = jwtverified; // Attach decoded payload
    next();
  } catch (error) {
    console.error("JWT Error:", error.message);
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
};
