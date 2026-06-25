import bcrypt from 'bcryptjs';

import {
  findUserByEmail,
  findUserById,
  createUser,
  findRoleByName,
  findRoleById,
  findAllRoles
} from './auth.repository.js';

import {
  generateAccessToken,
  generateRefreshToken
} from '../../shared/utils/jwt.utils.js';

import { AppError } from '../../shared/errors/AppError.js';

export const registerUser = async (data) => {

  const existingUser =
    await findUserByEmail(data.email);

  if (existingUser) {
    throw new AppError('User already exists with this email', 409, 'USER_EXISTS');
  }

  // Resolve role: accept either roleName (e.g. "Pharmacist") or roleId (UUID)
  let resolvedRoleId = null;

  if (data.roleName) {
    const role = await findRoleByName(data.roleName);
    if (!role) {
      throw new AppError(
        `Role "${data.roleName}" does not exist. Use GET /api/auth/roles to see available roles.`,
        400,
        'INVALID_ROLE'
      );
    }
    resolvedRoleId = role.id;
  } else if (data.roleId) {
    // Verify roleId actually exists in the database
    const role = await findRoleById(data.roleId);
    if (!role) {
      throw new AppError(
        'Invalid role ID provided. Use GET /api/auth/roles to see available roles.',
        400,
        'INVALID_ROLE'
      );
    }
    resolvedRoleId = role.id;
  } else {
    throw new AppError('Role is required (provide roleName or roleId)', 400, 'ROLE_REQUIRED');
  }

  const hashedPassword =
    await bcrypt.hash(
      data.password,
      10
    );

  const user =
    await createUser({
      username: data.username,
      email: data.email,
      password: hashedPassword,
      roleId: resolvedRoleId
    });

  // Return clean user object (no password)
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    roleId: user.roleId,
    role: user.role?.name ?? null
  };
};

export const loginUser = async (data) => {
  const user = await findUserByEmail(data.email);

  if (!user) {
    throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
  }

  if (!user.isActive) {
    throw new AppError('Account is deactivated', 403, 'ACCOUNT_INACTIVE');
  }

  const isPasswordValid = await bcrypt.compare(
    data.password,
    user.password
  );

  if (!isPasswordValid) {
    throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
  }

  const tokenPayload = {
    userId: user.id,
    email: user.email,
    roleId: user.roleId,
    roleName: user.role?.name ?? null
  };

  const accessToken = generateAccessToken(
    tokenPayload
  );

  const refreshToken = generateRefreshToken(
    tokenPayload
  );

  return {
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      roleId: user.roleId,
      role: user.role?.name ?? null
    },
    accessToken,
    refreshToken,
    expiresIn: process.env.JWT_EXPIRES_IN || '15m'
  };
};

export const getCurrentUser = async (userId) => {
  const user = await findUserById(userId);

  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

  if (!user.isActive) {
    throw new AppError('Account is deactivated', 403, 'ACCOUNT_INACTIVE');
  }

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    roleId: user.roleId,
    role: user.role?.name ?? null
  };
};

export const getAllRoles = async () => {
  const roles = await findAllRoles();
  return roles.map(role => ({
    id: role.id,
    name: role.name,
    description: role.description
  }));
};