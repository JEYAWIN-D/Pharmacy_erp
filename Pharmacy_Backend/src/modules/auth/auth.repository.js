import prisma from '../../config/prisma.js';

export const findUserByEmail = async (email) => {
  return prisma.user.findUnique({
    where: { email },
    include: {
      role: true
    }
  });
};

export const findUserById = async (id) => {
  return prisma.user.findUnique({
    where: { id },
    include: {
      role: true
    }
  });
};

export const createUser = async (userData) => {
  return prisma.user.create({
    data: userData,
    include: {
      role: true
    }
  });
};

// ── Role queries ──

export const findRoleByName = async (name) => {
  return prisma.role.findUnique({
    where: { name }
  });
};

export const findRoleById = async (id) => {
  return prisma.role.findUnique({
    where: { id }
  });
};

export const findAllRoles = async () => {
  return prisma.role.findMany({
    orderBy: { name: 'asc' }
  });
};
