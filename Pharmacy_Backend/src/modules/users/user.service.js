import {
  getUsers as findUsers,
  getUserById as findUserById,
  createUser as insertUser,
  updateUser as patchUser,
  deleteUser as removeUser
} from './user.repository.js';

export const getUsers = async () => {
  return findUsers();
};

export const getUserById = async (id) => {
  return findUserById(id);
};

export const createUser = async (userData) => {
  return insertUser(userData);
};

export const updateUser = async (id, userData) => {
  return patchUser(id, userData);
};

export const deleteUser = async (id) => {
  return removeUser(id);
};
