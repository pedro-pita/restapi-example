const jwt = require('jsonwebtoken');
const { User } = require('../models/User');
const { rolesEnum } = require('../models/User');

const haveRole = (role, action) => {
  return rolesEnum.includes(action) && role.includes(action);
};

const authorize = (action) => {
  return (req, res, next) => {
    if (haveRole(req.user.roles, action)) {
      return next();
    }
    return res.status(403).json({ message: 'Access not permitted' });
  };
};

const admin = (req, res, next) => {
  if (req?.user?.isAdmin) {
    return next();
  } 
  return res.status(401).json({ message: 'Not authorized as an admin' });
};

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization) {
    try {
      token = req.headers.authorization.replaceAll('Bearer', '').trim();
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
      if (!req.user) {
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }
      await req.user.updateLastLogin();
      return next();
    } catch (error) {
      console.error(error);
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } else {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

module.exports = { authorize, protect, admin };