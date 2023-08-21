const { Op } = require("sequelize");
const { Customer } = require("../database/models");
const { appLogger } = require("../utils/logger");
const sequelize = require("../database/sequelize");

async function getAllCustomers() {
  try {
    const customers = await Customer.findAll({
      attributes: [
        "customer_id",
        "customer_name",
        "customer_first_lastname",
        "customer_second_lastname",
        "customer_dni",
        "customer_phone",
        "customer_email",
        "customer_address",
      ],
      order: [["customer_id", "ASC"]],
    });
    return customers;
  } catch (error) {
    appLogger.error("Error fetching customers ", error);
    throw error;
  }
}

async function getCustomerByName(customer_name) {
  try {
    const customers = await Customer.findAll({
      where: {
        name: {
          [Op.like]: `%${customer_name}%`,
        },
      },
      attributes: [
        "customer_id",
        "customer_name",
        "customer_first_lastname",
        "customer_second_lastname",
        "customer_dni",
        "customer_phone",
        "customer_email",
        "customer_address",
      ],
      order: [["customer_id", "ASC"]],
    });
    console.log(customers);
    return customers;
  } catch (error) {
    appLogger.error("Error fetching customer by name ", error);
    throw error;
  }
}

async function getCustomerByPk(primary_key) {
  try {
    const customer = await Customer.findByPk(primary_key, {
      attributes: [
        "customer_id",
        "customer_name",
        "customer_first_lastname",
        "customer_second_lastname",
        "customer_dni",
        "customer_phone",
        "customer_email",
        "customer_address",
      ],
    });
    return customer;
  } catch (error) {
    appLogger.error("Error fetching customer by id ", error);
    throw error;
  }
}

async function createCustomer(customerData) {
  // console.log(customerData);
  const transaction = await sequelize.transaction();
  try {
    const customer = await Customer.create(
      customerData,
    { transaction }
    );
    await transaction.commit();
    return customer;
  } catch (error) {
    await transaction.rollback();
    appLogger.error("Error creating customer ", error);
    throw error;
  }
}

async function editCustomer(customer_id, customerData) {
  const transaction = await sequelize.transaction();
  try {
    const [updatedRowsCount] = await Customer.update(customerData, {
      where: { customer_id },
      transaction,
    });

    if (updatedRowsCount === 0) {
      throw new Error('Customer not found');
    }

    await transaction.commit();
    return customerData;
  } catch (error) {
    appLogger.error('Error updating customer')
    await transaction.rollback();
    throw error;
  }
}

async function deleteCustomer(customer_id) {
  const transaction = await sequelize.transaction();
  try {
    const customer = await Customer.destroy({ where: { customer_id } });
    await transaction.commit();
    return customer;
  } catch (error) {
    await transaction.rollback();
    appLogger.error('Error deleting customer');
    throw error;
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
