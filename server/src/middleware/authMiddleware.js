/**
 * Authentication and Authorization Middleware
 * 
 * WHY JWT:
 * In a distributed disaster response system with real-time sockets and mobile/web clients,
 * stateless JSON Web Tokens allow the backend to verify the requester's identity and role
 * on every HTTP and WebSocket request cryptographically without needing session table lookups.
 * 
 * WHY ROLE-BASED ACCESS CONTROL (RBAC):
 * Ensures separation of concerns:
 * - Victims can create requests and view their own status.
 * - Volunteers & NGOs can browse feeds and claim requests.
 * - Admins can verify and reject requests.
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'relief_shield_super_secure_jwt_secret_dev_key_2026'
      );

      // Attach user object (without password hash) to request
      req.user = await User.findById(decoded.id).select('-passwordHash');

      if (!req.user) {
        return res.status(401).json({ message: 'User not found or deleted' });
      }

      next();
    } catch (err) {
      console.error('[Auth Error] Token verification failed:', err.message);
      return res.status(401).json({ message: 'Not authorized, token invalid or expired' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, missing Bearer token' });
  }
};

/**
 * Middleware factory for restricting routes to specific roles
 * @param  {...string} roles Allowed roles ('victim', 'volunteer', 'ngo', 'donor', 'admin')
 */
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Role forbidden: ${req.user.role} does not have access to this resource`,
      });
    }

    next();
  };
};

module.exports = {
  protect,
  requireRole,
};
