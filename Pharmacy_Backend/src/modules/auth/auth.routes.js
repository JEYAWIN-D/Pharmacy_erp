import express from 'express';

import {
  register,
  login,
  getMe,
  getRoles
}
from './auth.controller.js';

import {
  registerValidation,
  loginValidation
}
from './auth.validation.js';

import { authenticate } from '../../shared/middleware/authenticate.js';

const router = express.Router();

// Public routes
router.post(
  '/register',
  registerValidation,
  register
);

router.post(
  '/login',
  loginValidation,
  login
);

// Public — fetch available roles for registration dropdown
router.get(
  '/roles',
  getRoles
);

// Protected — returns current user from JWT
router.get(
  '/me',
  authenticate,
  getMe
);

export default router;
