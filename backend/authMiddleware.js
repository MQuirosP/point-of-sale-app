const jwt = require("jsonwebtoken");

function authMiddleware(req, res, next) {;
  const token = req.header("Authorization");
  if (!token) {
    return res
      .status(401)
      .json({ message: "No authorization token was given" });
  }

  try {
    const decoded = jwt.verify(token, process.env.SECRET_KEY);

    // Agregar información del usuario al objeto req
    req.userId = decoded.userId;
    req.username = decoded.username;

    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid Authorization token" });
  }
}

module.exports = authMiddleware;
