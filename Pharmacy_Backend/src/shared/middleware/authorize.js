import { AppError } from '../errors/AppError.js';

/**
 * Role-based authorization middleware.
 * Usage: authorize('Admin', 'Pharmacist')
 * Must be used AFTER authenticate middleware.
 */
export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401, 'AUTH_REQUIRED'));
    }

    if (!allowedRoles.includes(req.user.roleName)) {
      return next(
        new AppError(
          `Access denied. Required roles: ${allowedRoles.join(', ')}`,
          403,
          'FORBIDDEN'
        )
      );
    }

    return next();
  };
};
