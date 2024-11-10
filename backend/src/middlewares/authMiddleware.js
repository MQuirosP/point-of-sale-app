const jwt = require("jsonwebtoken");

function authMiddleware(req, res, next) {
  // Excluir la ruta de login de la autenticación
  const token = req.header("Authorization")?.replace("Bearer ", "");
  if (
    (req.path === "/api/users/login/" && req.method === "POST") ||
    (req.path === "/api/users/" && req.method === "POST" && req.body.username) || // Ajustar según sea necesario
    (req.path === "/api/users/" && req.method === "GET")
  ) {
    return next();
  }

  // Extraer el token del encabezado Authorization

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
