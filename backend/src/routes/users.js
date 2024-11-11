const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const authMiddleware = require("../middlewares/authMiddleware");

router.post("/login", userController.loginUser);
router.post("/logout", userController.logoutUser);
router.get("/", userController.getAllUsers);
router.get("/:username", authMiddleware, userController.getUserByUsername);
router.get("/id/:id", authMiddleware, userController.getUserById);
router.put("/:id", userController.updateUser);
router.put("/reset-password/:username", userController.resetPassword);
router.post("/", authMiddleware, userController.createUser);
router.post("/changePassword", userController.changePassword);
router.delete("/:id", userController.deleteUser);

module.exports = router;
