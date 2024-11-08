const { appLogger } = require("../utils/logger");
const { User, BlacklistedToken } = require("../database/models");
const bcrypt = require("bcrypt");

async function createUser(userData) {
  try {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    userData.password = hashedPassword;
    const newUser = await User.create(userData);
    return newUser;
  } catch (error) {
    appLogger.error("Error creating user", error);
  }
}

async function loginUser(username, password) {
  try {
    const user = await User.findOne({ where: { username } });
    // if (!user) {
    //   throw new Error("Invalid username");
    // }
    // const isPasswordValid = bcrypt.compareSync(password, user.password);
    // if (!isPasswordValid) {
    //   throw new Error("Invalid password");
    // }
    return user;
  } catch (error) {
    appLogger.error("Error logging in", error);
    throw error;
  }
}

async function logoutUser(token, expiresAt) {
  try {
    await BlacklistedToken.create({ token, expiresAt });
  } catch (error) {
    appLogger.error("Error logging out user", error);
    throw error;
  }
}

async function getAllUsers() {
  try {
    const users = await User.findAll({
      order: [["userId", "ASC"]],
      attributes: ["username", "name", "lastname", "role", "status", "email"]
    });
    console.log(users);
    return users;
  } catch (error) {
    appLogger.error("Error fetching users", error);
    throw error;
  }
}

async function getUserByUsername(username) {
  try {
    const user = await User.findOne({
      where: { username }
    });
    if (!user) {
      return user;
    }
    return user;
  } catch (error) {
    appLogger.error('Error fetching user', error);
    throw error; // Devuelve una promesa rechazada en caso de error
  }
}

async function getUserById(id) {
  try {
    const user = await User.findByPk(id);
    if (!user) {
      return user;
    }
    return user;// Resto del código...
  } catch (error) {
    appLogger.error('Error fetching user', error);
    throw error;
  }
}

async function updateUser(userId, userData) {
  try {
    const [updatedRowsCount, [updatedUser]] = await User.update(
      userData,
      {
        where: {
          userId,
        },
        returning: true,
      }
    );
    if (updatedRowsCount === 0) {
      throw new Error("User not found");
    }
    return updatedUser;
  } catch (error) {
    appLogger.error('Error updating user: ', error);
    throw error;
  }
}

async function deleteUser(userId) {
  try {
    const deletedRowsCount = await User.destroy({
      where: { userId },
    });
    if (deletedRowsCount === 0) {
      throw new Error('User not found');
    }
    return deletedRowsCount;
  } catch (error) {
    appLogger.error('Error deleting user');
    throw error;
  }
}

module.exports = {
  createUser,
  getAllUsers,
  getUserByUsername,
  getUserById,
  getUserByUsername,
  updateUser,
  deleteUser,
  loginUser,
  logoutUser,
};
