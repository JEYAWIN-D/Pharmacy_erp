import { validationResult }
from 'express-validator';

import {
  registerUser,
  loginUser,
  getCurrentUser,
  getAllRoles
}
from './auth.service.js';

import { AppError } from '../../shared/errors/AppError.js';

export const register =
async (req, res, next) => {

  const errors =
    validationResult(req);

  if (!errors.isEmpty()) {
    return next(new AppError(errors.array().map((item) => item.msg).join(', '), 422, 'VALIDATION_ERROR'));
  }

  try {

    const user =
      await registerUser(req.body);

    res.status(201).json({
      success: true,
      message:
        'User registered successfully',
      data: user
    });

  } catch (error) {

    next(error);

  }
};

export const login = async (req, res, next) => {

  const errors =
    validationResult(req);

  if (!errors.isEmpty()) {
    return next(new AppError(errors.array().map((item) => item.msg).join(', '), 422, 'VALIDATION_ERROR'));
  }

  try {

    const result =
      await loginUser(req.body);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: result
    });

  } catch (error) {

    next(error);

  }
};

export const getMe = async (req, res, next) => {
  try {
    const user = await getCurrentUser(req.user.userId);

    res.status(200).json({
      success: true,
      message: 'User profile retrieved',
      data: user
    });
  } catch (error) {
    next(error);
  }
};

export const getRoles = async (req, res, next) => {
  try {
    const roles = await getAllRoles();

    res.status(200).json({
      success: true,
      message: 'Roles retrieved successfully',
      data: roles
    });
  } catch (error) {
    next(error);
  }
};