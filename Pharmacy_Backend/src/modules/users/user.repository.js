import prisma from '../../config/prisma.js';

export const getUsers = async () => {
  return prisma.user.findMany({
    orderBy: {
      createdAt: 'desc'
    }
  });
};

export const getUserById = async (id) => {
  return prisma.user.findUnique({
    where: { id }
  });
};

export const createUser = async (userData) => {
  return prisma.user.create({
    data: userData
  });
};

export const updateUser = async (id, userData) => {
  return prisma.user.update({
    where: { id },
    data: userData
  });
};

export const deleteUser = async (id) => {
  return prisma.user.delete({
    where: { id }
  });
};
