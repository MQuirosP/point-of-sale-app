const { Op } = require("sequelize");
const { Provider } = require("../database/models");
const { appLogger } = require("../utils/logger");
const sequelize = require("../database/sequelize");

async function getAllProviders() {
  try {
    const providers = await Provider.findAll({
      attributes: [
        "provider_id",
        "provider_name",
        "provider_dni",
        "provider_address",
        "provider_phone",
        "provider_email",
      ],
      order: [["provider_id", "ASC"]],
    });
    return providers;
  } catch (error) {
    appLogger.error("Error fetching providers ", error);
  }
}

async function getProviderByName(provider_name) {
  try {
    const providers = await Provider.findAll({
      where: {
        provider_name: {
          [Op.iLike]: `%${provider_name}%`,
        },
      },
      attributes: [
        "provider_id",
        "provider_name",
        "provider_dni",
        "provider_address",
        "provider_phone",
        "provider_email",
      ],
    });
    return providers;
  } catch (error) {
    appLogger.error("Error fetching provider by name ", error);
    throw error;
  }
}

async function getProviderByPk(primary_key) {
  try {
    const provider = await Provider.findByPk(primary_key, {
      attributes: [
        "provider_id",
        "provider_name",
        "provider_dni",
        "provider_address",
        "provider_phone",
        "provider_email",
      ],
    });
    return provider;
  } catch (error) {
    appLogger.error("Error fetching provider by id ", error);
    throw error;
  }
}

async function createProvider(providerData) {
  const transaction = await sequelize.transaction();
  try {
    const provider = await Provider.create(providerData, { transaction });
    await transaction.commit();

    return provider;
  } catch (error) {
    await transaction.rollback();
    appLogger.error("Error creating provider ", error);
    throw error;
  }
}

async function editProvider(provider_id, providerData) {
  const transaction = await sequelize.transaction();
  try {
    const [updateRowsCount] = await Provider.update(providerData, {
      where: { provider_id },
      transaction,
    });

    if (updateRowsCount === 0) {
      throw error;
    }

    await transaction.commit();
    return providerData;
  } catch (error) {
    appLogger.error("Error updating provider");
    await transaction.rollback();
    throw error;
  }
}

async function deleteProvider(provider_id) {
  const transaction = await sequelize.transaction();
  try {
    const provider = await Provider.destroy({
      where: { provider_id: provider_id },
    });
    await transaction.commit();
    return provider;
  } catch (error) {
    await transaction.rollback();
    appLogger.error("Error deleting provider");
    throw error;
  }
}

module.exports = {
  getAllProviders,
  getProviderByName,
  getProviderByPk,
  createProvider,
  editProvider,
  deleteProvider,
};
