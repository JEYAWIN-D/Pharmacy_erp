import prisma from '../../config/prisma.js';
import { AppError } from '../../shared/errors/AppError.js';

// ─── CUSTOMERS MODULE ─────────────────────────────────────────────────────────

const customerRepo = {
  create: async (data) => prisma.customer.create({ data }),
  findAll: async ({ search } = {}) => {
    const where = { isDeleted: false };
    if (search) where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } }
    ];
    return prisma.customer.findMany({ where, orderBy: { name: 'asc' } });
  },
  findById: async (id) => prisma.customer.findFirst({ where: { id: parseInt(id), isDeleted: false } }),
  findByMobile: async (mobile) => prisma.customer.findFirst({ where: { phone: mobile, isDeleted: false } }),
  update: async (id, data) => prisma.customer.update({ where: { id: parseInt(id) }, data })
};

export const customerController = {
  getAll: async (req, res, next) => {
    try { const d = await customerRepo.findAll(req.query); res.json({ success: true, data: d }); } catch (e) { next(e); }
  },
  getByMobile: async (req, res, next) => {
    try {
      const c = await customerRepo.findByMobile(req.params.mobile);
      if (!c) return res.json({ success: true, data: null }); // Don't throw error if not found, just return null for POS to handle
      res.json({ success: true, data: c });
    } catch (e) { next(e); }
  },
  getById: async (req, res, next) => {
    try {
      const c = await customerRepo.findById(req.params.id);
      if (!c) return next(new AppError('Customer not found', 404, 'NOT_FOUND'));
      res.json({ success: true, data: c });
    } catch (e) { next(e); }
  },
  create: async (req, res, next) => {
    try { const d = await customerRepo.create(req.body); res.status(201).json({ success: true, data: d }); } catch (e) { next(e); }
  },
  update: async (req, res, next) => {
    try {
      const c = await customerRepo.findById(req.params.id);
      if (!c) return next(new AppError('Customer not found', 404, 'NOT_FOUND'));
      const d = await customerRepo.update(req.params.id, req.body);
      res.json({ success: true, data: d });
    } catch (e) { next(e); }
  },
  remove: async (req, res, next) => {
    try {
      const c = await customerRepo.findById(req.params.id);
      if (!c) return next(new AppError('Customer not found', 404, 'NOT_FOUND'));
      await customerRepo.update(req.params.id, { isDeleted: true });
      res.json({ success: true, message: 'Customer deleted' });
    } catch (e) { next(e); }
  }
};
