const sendSuccessResponse = (res, data = null, statusCode = 200, token = null ) => {
 
  const response = {
    success: true,
    message: data,
  };

  if (token !== null) {
    response.token = token;
  };
  
  res.status(statusCode).json(response)
};

const sendErrorResponse = (
  res,
  message = "Internal server error",
  statusCode = 500
) => {
  res.status(statusCode).json({
    success: false,
    error: message,
  });
};

const sendErrorDetailsResponse = (
  res,
  message = "Internal server error",
  details = {},
  statusCode = 500
) => {
  res.status(statusCode).json({
    success: false,
    error: message,
    details: details,
  });
};

module.exports = {
  sendSuccessResponse,
  sendErrorResponse,
  sendErrorDetailsResponse,
};
