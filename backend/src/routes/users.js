const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");

router.post("/login", userController.loginUser);
router.post("/logout", userController.logoutUser);
router.get("/", userController.getAllUsers);
router.get("/:username", userController.getUserByUsername);
router.get("/id/:id", userController.getUserById);
router.put("/:id", userController.updateUser);
router.put("/reset-password/:username", userController.resetPassword);
router.post("/", userController.createUser);
router.post("/changePassword", userController.changePassword);
router.delete("/:id", userController.deleteUser);

module.exports = router;
