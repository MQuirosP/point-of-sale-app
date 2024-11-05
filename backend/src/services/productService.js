const { Product } = require("../database/models");
const { dbLogger, appLogger } = require("../utils/logger");
const { Op } = require("sequelize");

async function getAllProducts() {
  try {
    const products = await Product.findAll({
      order: [["name", "ASC"]],
    });
    return products;
  } catch (error) {
    appLogger.error("Error fetching products", error);
    throw error;
  }
}

async function getProductByName(name) {
  try {
    const products = await Product.findAll({
      where: {
        name: {
          [Op.iLike]: `%${name}%`,
        },
      },
    });
    return products;
  } catch (error) {
    appLogger.error("Error fetching product by name", error);
    throw error;
  }
}

async function getProductByIntCode(int_code) {
  try {
    const product = await Product.findOne({ where: { int_code: int_code } });
    return product;
  } catch (error) {
    appLogger.error("Error fetching product by internal code", error);
    throw error;
  }
}

async function getProductoByPk(primary_key) {
  try {
    const product = await Product.findByPk(primary_key);
    return product;
  } catch (error) {
    appLogger.error('Error fetching product by primary key')
  }
}

async function createProduct(productData) {
  try {
    const product = await Product.create(productData, {
      individualHooks: true, // Habilitar hooks de creación específicos
    });
    return product;
  } catch (error) {
    appLogger.error("Error creating product: ", error);
    throw error;
  }
}


async function updateProduct(productId, productData) {
  try {
    const [updatedRowsCount, [updatedProduct]] = await Product.update(
      productData,
      {
        where: {
          productId
        },
        individualHooks: true,
        returning: true,
      }
    );
    if (updatedRowsCount === 0) {
      throw new Error("Product not found");
    }
    return updatedProduct;
  } catch (error) {
    appLogger.error("Error updating product: ", error);
    throw error;
  }
}

async function deleteProduct(int_code) {
  try {
    const deletedRowsCount = await Product.destroy({
      where: { int_code },
    });
    if (deletedRowsCount === 0) {
      throw new Error("Product not found");
    }
    
    return deletedRowsCount;
  } catch (error) {
    appLogger.error("Error deleting product: ", error);
    throw error;
  }
}

module.exports = {
  getAllProducts,
  getProductByIntCode,
  getProductByName,
  getProductoByPk,
  createProduct,
  updateProduct,
  deleteProduct,
};
