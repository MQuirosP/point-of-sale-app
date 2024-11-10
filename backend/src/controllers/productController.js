const productService = require("../services/productService");
const { appLogger } = require("../utils/logger");
const responseUtils = require("../utils/responseUtils");

async function getAllProducts(res) {
  try {
    const products = await productService.getAllProducts();
    const productsView = products.map((products) => products.getView());
    responseUtils.sendSuccessResponse(res, { products: productsView });
  } catch (error) {
    appLogger.error("Error getting products ", error);
    responseUtils.sendErrorResponse(res, "Error retrieving products");
  }
}
async function getProductByIntCode(req, res) {
  const { int_code } = req.params;
  try {
    const product = await productService.getProductByIntCode(int_code);
    if (!product) {
      return responseUtils.sendErrorResponse(res, "Product not found", 200);
    }
    const productView = product.getView();
    responseUtils.sendSuccessResponse(res, { product: productView }, 200);
  } catch (error) {
    appLogger.error("Error getting product by id", error);
    responseUtils.sendErrorResponse(res, "Error retrieving product", 404);
  }
}
async function getProductByName(req, res) {
  const { name } = req.params;
  try {
    const products = await productService.getProductByName(name);
    if (products.length === 0) {
      return responseUtils.sendErrorResponse(res, "No products found");
    }
    const productsView = products.map((products) => products.getView());
    responseUtils.sendSuccessResponse(res, { products: productsView });
  } catch (error) {
    appLogger.error("Error getting product by name ", error);
    responseUtils.sendErrorResponse(res, "Error getting product by name");
  }
}

async function getProductByPk(req, res) {
  const { id } = req.params;
  try {
    const product = await productService.getProductoByPk(id);
    if (product.length === 0) {
      return responseUtils.sendErrorResponse(res, "No product found");
    }
    responseUtils.sendSuccessResponse(res, { product: product });
  } catch (error) {
    appLogger.error("Error getting product by id ", error);
    responseUtils.sendErrorResponse(res, "Error getting product by id");
  }
}

async function createProduct(req, res) {
  const {
    name,
    purchase_price,
    description,
    category_id,
    int_code,
    sale_price,
    taxes,
    margin,
    taxPercentage,
  } = req.body;

  try {
    const productData = {
      name,
      purchase_price,
      description,
      category_id,
      quantity: 0,
      int_code,
      sale_price,
      taxes,
      margin,
      taxPercentage,
    };
    const product = await productService.createProduct(productData);

    responseUtils.sendSuccessResponse(res, product, 201);
  } catch (error) {
    appLogger.error("Error creating product ", error);
    responseUtils.sendErrorResponse(res, "Error creating product");
  }
}

async function updateProduct(req, res) {
  const { id } = req.params;
  const productData = req.body;
  try {
    const product = await productService.updateProduct(id, productData);
    const productView = product.getView();
    responseUtils.sendSuccessResponse(res, { product: productView }, 200);
  } catch (error) {
    appLogger.error("Error updating product ", error);
    responseUtils.sendErrorResponse(res, "Error updating product");
  }
}

async function deleteProduct(req, res) {
  try {
    const { int_code } = req.params;
    const { password } = req.body;
    console.log(password);
    const myPassword = process.env.DELETE_PASSWORD;
    console.log(myPassword);
    if (password.trim() !== myPassword.trim()) {
      return responseUtils.sendErrorResponse(res, "Invalid password", 403);
    }

    const deletedRowsCount = await productService.deleteProduct(int_code);

    if (deletedRowsCount === 0) {
      return responseUtils.sendErrorResponse(res, "Product not found", 404);
    }

    const data = {
      deletedRowsCount,
      message: `Product successfully deleted`,
    };

    responseUtils.sendSuccessResponse(res, data);
  } catch (error) {
    appLogger.error("Error deleting product", error);
    responseUtils.sendErrorResponse(
      res,
      `Error deleting product: ${error.message}`
    );
  }
}

module.exports = {
  getAllProducts,
  getProductByIntCode,
  getProductByName,
  getProductByPk,
  createProduct,
  updateProduct,
  deleteProduct,
};
