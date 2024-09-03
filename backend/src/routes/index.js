const express = require("express");
const router = express.Router();
const bodyParser = require("body-parser");
const backupDBService = require("../services/backupDBService");
const authMiddleware = require("../../authMiddleware");

// Configuración de body-parser
router.use(bodyParser.urlencoded({ extended: false }));
router.use(bodyParser.json());

// Middleware para autenticación en métodos POST, PUT y DELETE
// router.use((req, res, next) => {
//   if (["POST", "PUT", "DELETE"].includes(req.method)) {
//     authMiddleware(req, res, next);
//   } else {
//     next();
//   }
// });

// Importar y usar las rutas modularizadas
router.use("/api/products", require("./products"));
router.use("/api/purchases", require("./purchases"));
router.use("/api/sales", require("./sales"));
router.use("/api/users", require("./users"));
router.use("/api/providers", require("./providers"));
router.use("/api/customers", require("./customers"));
router.use("/api/options", require("./options"));
router.use("/api/audits", require("./audits"));
router.use("/api/reports", require("./reports"));

// Ruta para respaldo de base de datos
router.get("/api/backup", (req, res) => {
  const backupResult = backupDBService.backupDataBase();
  res.json(backupResult);
});

module.exports = router;
