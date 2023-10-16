const express = require("express");
const router = express.Router();
const productController = require("./controllers/productController");
const purchaseController = require("./controllers/purchaseController");
const userController = require("./controllers/userController");
const saleController = require("./controllers/saleController");
const bodyParser = require("body-parser");
const providerController = require("./controllers/providerController");
const customerControler = require('./controllers/customerController');
const optionsController = require("./controllers/optionsController");
const excelReportsController = require("./controllers/excelReportsController");
const backupDBService = require('./services/backupDBService');
const authMiddleware = require("../authMiddleware");
const auditController = require("./controllers/auditController");

router.use(bodyParser.urlencoded({ extended: false }));
router.use(bodyParser.json());

router.post('/api/users/login/',  userController.loginUser);
router.post('/api/users/logout/', userController.logoutUser);
router.post('/api/audits', auditController.createAudit)
router.get('/api/audits', auditController.getAllAudits)
router.get('/api/audits/:doc_number', auditController.getAuditByDocNumber)

router.use((req, res, next) => {
  if (req.method === "POST" || req.method === "PUT" || req.method === "DELETE") {
    authMiddleware(req, res, next);
  } else {
    next();
  }
});

// router.use(authMiddleware)

// RUTAS MANEJO PRODUCTOS
router.get("/api/products", productController.getAllProducts);
router.get(
  "/api/products/int_code/:int_code",
  productController.getProductByIntCode
);
router.get("/api/products/name/:name", productController.getProductByName);
router.get("/api/products/int_code/:int_code", productController.getProductByIntCode)
router.get("/api/products/id/:id", productController.getProductByPk);
router.post("/api/products/", productController.createProduct);
router.put("/api/products/:id", productController.updateProduct);
router.delete("/api/products/:int_code", productController.deleteProduct);

// RUTAS MANEJO COMPRAS
router.get("/api/purchases", purchaseController.getAllPurchases);
router.get(
  "/api/purchases/doc_number/:doc_number",
  purchaseController.getPurchaseByDocNumber
);
router.get('/api/purchases/date/:date', purchaseController.getPurchasesByDate)
router.post("/api/purchases/", purchaseController.createPurchase);
router.put("/api/purchases/:doc_number", purchaseController.cancelPurchase);
router.delete("/api/purchases/:doc_number", purchaseController.deletePurchase);

// RUTAS MANEJO VENTAS
router.get("/api/sales", saleController.getAllSales);
router.get("/api/sales/doc_number/:doc_number", saleController.getSaleByDocNumber);
router.get('/api/sales/date/:date', saleController.getSalesByDate)
router.post("/api/sales/", saleController.createSale);
router.put("/api/sales/:doc_number", saleController.cancelSale);
router.delete("/api/sales/:doc_number", saleController.deleteSale);

// RUTAS MANEJO USUARIOS
router.get("/api/users", userController.getAllUsers);
router.get('/api/users/:username', userController.getUserByUsername)
router.get('/api/users/id/:id', userController.getUserById);
router.put('/api/users/:id', userController.updateUser);
router.put('/api/users/reset-password/:username', userController.resetPassword);
router.delete('/api/users/:id', userController.deleteUser);
router.post("/api/users/", userController.createUser);

router.post("/api/users/changePassword/", userController.changePassword);

// RUTAS CONTROL OPCIONES
router.get("/api/options/:id", optionsController.getOptions);
router.put("/api/options/:id", optionsController.updateOptions);

// RUTAS MANEJO CLIENTES
router.get('/api/customers', customerControler.getAllCustomers);
router.get('/api/customers/name/:name', customerControler.getCustomerByName);
router.get('/api/customers/id/:id', customerControler.getCustomerByPk);
router.put('/api/customers/:id', customerControler.editCustomer);
router.post('/api/customers/', customerControler.createCustomer);
router.delete('/api/customers/:id', customerControler.deleteCustomer);

// RUTAS MANEJO PROVEEDORES
router.get('/api/providers', providerController.getAllProviders);
router.get('/api/providers/name/:name', providerController.getProviderByName);
router.get('/api/providers/id/:id', providerController.getProviderByPk);
router.put('/api/providers/:id', providerController.editProvider);
router.post('/api/providers/', providerController.createProvider);
router.delete('/api/providers/:id', providerController.deleteProvider);

// RUTAS MANEJO DE AUDITORIAS
router.get("/api/stock-audit", auditController.getAllAudits);

// RUTAS REPORTES VENTAS/COMPRAS
router.post('/api/sales-report', excelReportsController.generateSalesReport);
router.post('/api/purchases-report', excelReportsController.generatePurchasesReport)

// Ruta para crear el respaldo de la base de datos
router.get("/api/backup", (req, res) => {
  const backupResult = backupDBService.backupDataBase();
  res.json(backupResult);
});

module.exports = router;
