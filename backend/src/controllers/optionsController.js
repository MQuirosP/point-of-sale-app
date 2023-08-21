const responseUtils = require("../utils/responseUtils");
const { appLogger } = require("../utils/logger");
const optionService = require("../services/optionsService");

const optionsController = {
  getOptions: async (req, res) => {
    const { id } = req.params;
    try {
      const options = await optionService.getOptions(id);
      responseUtils.sendSuccessResponse(res, { options });
    } catch (error) {
      appLogger.error("Error retrieving options status", error);
      responseUtils.sendErrorResponse(res, "Error retrieving options status");
    }
  },
  updateOptions: async (req, res) => {
    try {
      const { id } = req.params;
      const { activateRegister } = req.body;
      await optionService.updateOptions(id, activateRegister);
      responseUtils.sendSuccessResponse(res, "Option status updated successfully");
    } catch (error) {
      appLogger.error("Error updating option status", error);
      responseUtils.sendErrorResponse(res, "Error updating options status");
    }
  },
};

module.exports = optionsController;