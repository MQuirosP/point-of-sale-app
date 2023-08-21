const responseUtils = require("../utils/responseUtils");
const { appLogger } = require("../utils/logger");
const customerService = require("../services/customerService");

async function getAllCustomers(req, res) {
  try {
    const customers = await customerService.getAllCustomers();
    responseUtils.sendSuccessResponse(res, { customers });
  } catch (error) {
    appLogger.error("Error getting customers", error);
    responseUtils.sendErrorResponse(res, "Error getting customers");
  }
}

async function getCustomerByName(req, res) {
  const { customer_name } = req.params;
  try {
    const customer = await customerService.getCustomerByName(customer_name);
    if (customer.length === 0) {
      return responseUtils.sendErrorResponse(res, "No customer found");
    }
    responseUtils.sendSuccessResponse(res, { customer: customer });
  } catch (error) {
    appLogger.error("Error getting customer by name ", error);
    responseUtils.sendErrorResponse(res, "Error getting customer by name");
  }
}

async function getCustomerByPk(req, res) {
  const { id } = req.params;
  console.log(id);
  try {
    const customer = await customerService.getCustomerByPk(id);
    if (customer.length === 0) {
      return responseUtils.sendErrorResponse(res, "No customer found");
    }
    responseUtils.sendSuccessResponse(res, { customer: customer });
  } catch (error) {
    appLogger.error("Error getting customer by id ", error);
    responseUtils.sendErrorResponse(res, "Error getting customer by id");
  }
}

async function createCustomer(req, res) {
  const {
    customer_name,
    customer_first_lastname,
    customer_second_lastname,
    customer_address,
    customer_phone,
    customer_email,
    customer_dni,
  } = req.body;
  try {
    const customerData = {
      customer_name,
      customer_first_lastname,
      customer_second_lastname,
      customer_address,
      customer_phone,
      customer_email,
      customer_dni,
    };
    const customer = await customerService.createCustomer(customerData);
    return responseUtils.sendSuccessResponse(res, customer, 201);
  } catch (error) {
    appLogger.error("Error creating customer ", error);
    responseUtils.sendErrorResponse(res, "Error creating customer");
  }
}

async function editCustomer(req, res) {
  const { id } = req.params;
  const customerData = req.body;
  try {
    const customer = await customerService.editCustomer(id, customerData);
    return responseUtils.sendSuccessResponse(res, customer, 201);
  } catch (error) {
    appLogger.error("Error updating customer", error);
    responseUtils.sendErrorResponse(res, "Error updating customer");
  }
}

async function deleteCustomer(req, res) {
  const { id } = req.params;
  try {
    const deletedRowsCount = await customerService.deleteCustomer(id);

    if (deletedRowsCount === 0) {
      return responseUtils.sendErrorResponse(res, 'Customer not found');
    }

    const data = {
      deletedRowsCount,
      message: 'Customer deleted successfully'
    }
    return responseUtils.sendSuccessResponse(res, data)
  } catch (error) {
    appLogger.error('Error deleting customer');
    responseUtils.sendErrorResponse(res, 'Error deleting customer'); 
  }
}

module.exports = {
  getAllCustomers,
  getCustomerByName,
  getCustomerByPk,
  createCustomer,
  editCustomer,
  deleteCustomer,
};
