const salesReportService = require('../services/excelReportsService')
const responseUtils = require("../utils/responseUtils")
const { appLogger } = require("../utils/logger")


async function generateSalesReport(req, res) {
    try {
      const startDate = req.body.startDate;
      const endDate = req.body.endDate;
  
      const salesReport = await salesReportService.generateSalesReport(startDate, endDate);
  
      responseUtils.sendSuccessResponse(res, salesReport)
    } catch (error) {
      appLogger.error('Error generating sales report:', error);
      responseUtils.sendErrorResponse(res, 'Error retrieving sales data')
    }
  }

async function generatePurchasesReport(req, res) {
  try {
    const startDate = req.body.startDate;
    const endDate = req.body.endDate;

    const purchasesReport = await salesReportService.generatePurchasesReport(startDate, endDate)

    responseUtils.sendSuccessResponse(res, purchasesReport);
  } catch (error) {
    appLogger.error('Error generating purchases report: ', error)
    responseUtils.sendErrorResponse(res, 'Error retrieving purchases data')
  }
}
  
  module.exports = {
    generateSalesReport,
    generatePurchasesReport,
  };