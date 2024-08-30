const jwt = require("jsonwebtoken");

function authMiddleware(req, res, next) {
  // Extraer el token del encabezado Authorization
  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ message: "No authorization token was given" });
  }

  try {
    // Verificar el token
    const decoded = jwt.verify(token, process.env.SECRET_KEY);

    // Agregar información del usuario al objeto req
    req.userId = decoded.userId;
    req.username = decoded.username;

    next();
  } catch (error) {
    // Manejo específico de errores JWT
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired" });
    }
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Invalid token" });
    }
    return res.status(401).json({ message: "Authorization error" });
  }
}

module.exports = authMiddleware;
