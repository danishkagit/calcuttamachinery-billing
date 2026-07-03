const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'calcutta_machinery_jwt_secret_2024');
      req.user = await User.findById(decoded.id).select('-password');
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'User not found' });
      }
      next();
    } catch (error) {
      return res.status(401).json({ success: false, error: 'Not authorized, token invalid' });
    }
  } else {
    return res.status(401).json({ success: false, error: 'Not authorized, no token provided' });
  }
};

module.exports = { protect };
