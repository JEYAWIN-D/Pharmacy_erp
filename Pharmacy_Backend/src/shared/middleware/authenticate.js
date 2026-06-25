import { verifyAccessToken } from '../utils/jwt.utils.js';
import { AppError } from '../errors/AppError.js';

export const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(new AppError('Access token missing', 401, 'TOKEN_MISSING'));
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);

    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      roleId: decoded.roleId,
      roleName: decoded.roleName
    };

    return next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(new AppError('Access token expired', 401, 'TOKEN_EXPIRED'));
    }

    if (err.name === 'JsonWebTokenError') {
      return next(new AppError('Invalid access token', 401, 'TOKEN_INVALID'));
    }

    return next(err);
  }
};