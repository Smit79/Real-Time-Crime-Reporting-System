const ApiError = require('../utils/apiError');

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new ApiError(`Role '${req.user.role}' is not allowed to access this route`, 403)
      );
    }
    next();
  };
};

module.exports = { authorize };