import jwt from 'jsonwebtoken';

import { jwtConfig } from '../../config/jwt.config.js';

export const generateAccessToken = (payload) => {
  return jwt.sign(payload, jwtConfig.secret, {
    expiresIn: jwtConfig.expiresIn
  });
};

export const generateRefreshToken = (payload) => {
  return jwt.sign(payload, jwtConfig.refreshSecret, {
    expiresIn: jwtConfig.refreshExpiresIn
  });
};

export const verifyAccessToken = (token) => {
  return jwt.verify(token, jwtConfig.secret);
};

export const verifyRefreshToken = (token) => {
  return jwt.verify(token, jwtConfig.refreshSecret);
};