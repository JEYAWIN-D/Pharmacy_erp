import prisma from '../../config/prisma.js';

export const createCategory = async (data) => {
  return prisma.category.create({
    data
  });
};

export const getCategories = async () => {
  return prisma.category.findMany({
    orderBy: { createdAt: 'desc' }
  });
};

export const getCategoryById = async (id) => {
  return prisma.category.findUnique({
    where: { id }
  });
};

export const getCategoryByName = async (name) => {
  return prisma.category.findUnique({
    where: { name }
  });
};

export const updateCategory = async (id, data) => {
  return prisma.category.update({
    where: { id },
    data
  });
};

export const deleteCategory = async (id) => {
  return prisma.category.delete({
    where: { id }
  });
};

export const toggleCategoryStatus = async (id, isActive) => {
  return prisma.category.update({
    where: { id },
    data: { isActive }
  });
};
