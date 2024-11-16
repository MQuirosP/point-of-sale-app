require("dotenv").config();
const { appLogger } = require("../utils/logger");
const responseUtils = require("../utils/responseUtils");
const userService = require("../services/userService");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

async function createUser(req, res) {
  const { username, name, lastname, password, email } = req.body;

  if (!username || !password || !name || !lastname) {
    responseUtils.sendErrorResponse(res, "Missing required fields");
    return;
  }

  const checkUser = await userService.getUserByUsername(username);
  if(checkUser){
    appLogger.debug('User already exists')
    responseUtils.sendErrorResponse(res, 'Username already exists')
    return;
  }
  const userData = {
    username: username.toLowerCase(),
    // email,
    password,
    name: name.toLowerCase(),
    lastname: lastname.toLowerCase(),
    email: email.toLowerCase(),
  };

  try {
    const newUser = await userService.createUser(userData);
    if(!newUser) {
      appLogger.error('Error creating new User')
      responseUtils.sendErrorResponse(res, "Error creating new User")
    }
    appLogger.debug('User created', { User: newUser})
    responseUtils.sendSuccessResponse(res, newUser, 201);
  } catch (error) {
    appLogger.error("Error creating user", error);
    responseUtils.sendErrorResponse(res, "Error creating user");
  }
}

async function loginUser(req, res) {
  const { username, password } = req.body;
  try {
    // Verificar si el usuario existe
    const user = await userService.getUserByUsername(username);
    if (!user) {
      responseUtils.sendErrorResponse(res, "Invalid user");
      return;
    }

    // Llamar al método loginUser para verificar la contraseña
    const loggedInUser = await userService.loginUser(username, password);
    if (!loggedInUser) {
      responseUtils.sendErrorResponse(res, "Invalid credentials");
      return;
    }

    const secretKey = process.env.SECRET_KEY || "";
    const payload = {
      userId: loggedInUser.userId,
      username: loggedInUser.username
    }
    // Generar el token de autenticación
    const token = jwt.sign(
      payload, secretKey,
      { algorithm: 'HS256' }
    );

    // Enviar la respuesta exitosa incluyendo el nombre del usuario y el token
    responseUtils.sendSuccessResponse(
      res,
      {
        result: "Login successful",
        username: user.username,
        name: user.name,
        token: token,
        role: user.role,
        status: user.status,

      },
      200
    );
  } catch (error) {
    appLogger.error("Error logging in", error);
    responseUtils.sendErrorResponse(res, "Error logging in");
  }
}

async function logoutUser(req, res) {
  const { token } = req.body;
  try {
    const expiresAt = new Date();
    await userService.logoutUser(token, expiresAt);
    responseUtils.sendSuccessResponse(res, "User logged out successfully");
  } catch (error) {
    appLogger.error("Error logging out user", error);
    responseUtils.sendErrorResponse(res, "Error logging out user");
  }
}

async function getAllUsers(req, res) {
  try {
    const users = await userService.getAllUsers();
    // const usersView = users.map((users) => ({
    //   userId: users.userId,
    //   username: users.username,
    //   // password: users.password,
    //   email: users.email,
    //   name: users.name,
    //   lastname: users.lastname,
    //   role: users.role,
    //   // createdAt: users.createdAt,
    //   // updatedAt: users.updatedAt,
    //   status: users.status,
    // }));
    responseUtils.sendSuccessResponse(res, { Users: users });
  } catch (error) {
    appLogger.error("Error getting users", error);
    responseUtils.sendErrorResponse(res, "Error retrieving users");
  }
}

async function getUserByUsername(req, res) {
  const { username } = req.params;
  try {
    const user = await userService.getUserByUsername(username);

    // Retornar inmediatamente si se encuentra el usuario
    if (user) {
      return responseUtils.sendSuccessResponse(res, user);
    }

    // Retornar inmediatamente si el usuario no existe
    return responseUtils.sendErrorResponse(res, "User does not exist", 200);

  } catch (error) {
    // Manejar cualquier error durante la obtención del usuario
    return responseUtils.sendErrorResponse(res, "Error retrieving user", 500);
  }
}


async function getUserById(req, res) {
  const { id } = req.params;
  try {
    const user = await userService.getUserById(id);
    if (user) {
      responseUtils.sendSuccessResponse(res, {User: user});
    } else {
      responseUtils.sendErrorResponse(res, 'User does not exist', 404);
    }

  } catch (error) {
    responseUtils.sendErrorResponse(res, "Error retrieving user")
  }
}

async function updateUser(req, res) {
  const { id } = req.params;
  const userData = req.body;
  try {
    const user = await userService.updateUser(id, userData);
    if (!user) {
      responseUtils.sendErrorResponse(res, "Error updating user");
    }
    responseUtils.sendSuccessResponse(res, user);
  } catch (error) {
    responseUtils.sendErrorResponse(res, "Error updating user ");
  }
}

async function deleteUser(req, res) {
  try {
    const { id } = req.params;
    const deletedRowsCount = await userService.deleteUser(id);
    if (deletedRowsCount === 0) {
      return responseUtils.sendErrorResponse(res, 'User not found');
    }

    const data = {
      deletedRowsCount,
      message: 'User successfully deleted',
    }
    responseUtils.sendSuccessResponse(res, data);
  } catch (error) {
    appLogger.error('Error deleting user', error);
    responseUtils.sendErrorResponse(res, 'Error deleting user')
  }
}

async function changePassword(req, res) {
  const { username, currentPassword, newPassword } = req.body;
  try {
    const user = await userService.getUserByUsername(username);
    if (!user) {
      responseUtils.sendErrorResponse(res, "User does not exist", 404);
      return;
    }

    const isPasswordValid = bcrypt.compareSync(currentPassword, user.password);
    if (!isPasswordValid) {
      responseUtils.sendErrorResponse(res, "Invalid current password");
      return;
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedNewPassword;
    await user.save();

    responseUtils.sendSuccessResponse(res, "Password changed successfully");
  } catch (error) {
    appLogger.error("Error changing password", error);
    responseUtils.sendErrorResponse(res, "Error changing password");
  }
}

async function resetPassword(req, res) {

  const { username } = req.params;
  const { newPassword } = req.body;
  try {
    const user = await userService.getUserByUsername(username);
    if (!user) {
      responseUtils.sendErrorResponse(res, "User does not exist", 404);
      return;
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedNewPassword;
    await user.save();

    responseUtils.sendSuccessResponse(res, "Password reset successfully");
  } catch (error) {
    appLogger.error("Error resetting password", error);
    responseUtils.sendErrorResponse(res, "Error resetting password");
  }
}


module.exports = {
  createUser,
  getAllUsers,
  getUserById,
  getUserByUsername,
  updateUser,
  deleteUser,
  loginUser,
  logoutUser,
  changePassword,
  resetPassword,
};
