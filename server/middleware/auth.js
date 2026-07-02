const protect = async (req, res, next) => {
  next();
};

module.exports = { protect };
