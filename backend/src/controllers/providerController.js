const responseUtils = require("../utils/responseUtils");
const { appLogger } = require("../utils/logger");
const providerService = require("../services/providerService");

async function getAllProviders(req, res) {
  try {
    const providers = await providerService.getAllProviders();
    responseUtils.sendSuccessResponse(res, { providers });
  } catch (error) {
    appLogger.error("Error getting providers ", error);
    responseUtils.sendErrorResponse(res, 'Error getting providers');
  }
}

async function getProviderByName(req, res) {
  const { provider_name } = req.params;
  try {
    const provider = await providerService.getProviderByName(provider_name);
    if (provider.length === 0) {
      return responseUtils.sendErrorResponse(res, "No provider found");
    }
    responseUtils.sendSuccessResponse(res, { provider: provider });
  } catch (error) {
    appLogger.error("Error getting provider by name ", error);
    responseUtils.sendErrorResponse(res, "Error getting provider by name");
  }
}

async function getProviderByPk(req, res) {
  const { id } = req.params;

  try {
    const provider = await providerService.getProviderByPk(id);
    if (provider.length === 0) {
      return responseUtils.sendErrorResponse(res, "No provider found");
    }
    responseUtils.sendSuccessResponse(res, { provider: provider });
  } catch (error) {
    appLogger.error('Error getting provider by id ', error);
    responseUtils.sendErrorResponse(res, 'Error getting provider by id')
  }
}

async function createProvider(req, res) {
  const { 
    provider_name, 
    provider_address, 
    provider_phone, 
    provider_email, 
    provider_dni } = req.body;
  try {
    const providerData = {
      provider_name, 
      provider_address,
       provider_phone, 
       provider_email, 
       provider_dni,
    };
    const provider = await providerService.createProvider(providerData);
    return responseUtils.sendSuccessResponse(res, provider, 201);
  } catch (error) {
    appLogger.error('Error creating provider ', error);
    responseUtils.sendErrorResponse(res, 'Error creating provider')
  }
}

async function editProvider(req, res) {
  const { id } = req.params;
  const providerData = req.body;
  try {
    const provider = await providerService.editProvider(id, providerData);
    return responseUtils.sendSuccessResponse(res, provider, 201)
  } catch (error) {
    appLogger.error('Error updating provider');
    responseUtils.sendErrorResponse(res, 'Error updating provider')
  }
}

async function deleteProvider(req, res) {
  const { id } = req.params;
  try {
    const deletedRowsCount = await providerService.deleteProvider(id);

    if (deletedRowsCount === 0) {
      return responseUtils.sendErrorResponse(res, 'Provider not found')
    }

    const data = {
      deletedRowsCount,
      message: 'Provider deleted successfully'
    }
    return responseUtils.sendSuccessResponse(res, data);
  } catch (error) {
    appLogger.error('Error deleting provider');
    responseUtils.sendErrorResponse(res, 'Error deleting provider');
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
