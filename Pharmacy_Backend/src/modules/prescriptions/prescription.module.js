import prisma from '../../config/prisma.js';
import { AppError } from '../../shared/errors/AppError.js';

// ─── PRESCRIPTION REPOSITORY ──────────────────────────────────────────────────
const prescriptionRepo = {
  create: async (data) => {
    const { items, ...rest } = data;
    return prisma.prescription.create({
      data: { ...rest, items: { create: items || [] } },
      include: { items: true }
    });
  },
  findAll: async ({ status, search }) => {
    const where = { isDeleted: false };
    if (status) where.status = status;
    if (search) where.OR = [
      { patientName: { contains: search, mode: 'insensitive' } },
      { doctorName: { contains: search, mode: 'insensitive' } }
    ];
    return prisma.prescription.findMany({ where, include: { items: true }, orderBy: { date: 'desc' } });
  },
  findById: async (id) => prisma.prescription.findFirst({
    where: { id, isDeleted: false }, include: { items: true }
  }),
  update: async (id, data) => prisma.prescription.update({ where: { id }, data })
};

// ─── PRESCRIPTION SERVICE ─────────────────────────────────────────────────────
export const prescriptionService = {
  create: async (data) => prescriptionRepo.create(data),
  getAll: async (params) => prescriptionRepo.findAll(params),
  getById: async (id) => {
    const p = await prescriptionRepo.findById(id);
    if (!p) throw new AppError('Prescription not found', 404, 'NOT_FOUND');
    return p;
  },
  update: async (id, data) => {
    const p = await prescriptionRepo.findById(id);
    if (!p) throw new AppError('Prescription not found', 404, 'NOT_FOUND');
    return prescriptionRepo.update(id, data);
  },
  delete: async (id) => {
    const p = await prescriptionRepo.findById(id);
    if (!p) throw new AppError('Prescription not found', 404, 'NOT_FOUND');
    return prescriptionRepo.update(id, { isDeleted: true });
  }
};

// ─── PRESCRIPTION CONTROLLER ──────────────────────────────────────────────────
export const prescriptionController = {
  getAll: async (req, res, next) => {
    try { const d = await prescriptionService.getAll(req.query); res.json({ success: true, data: d }); } catch (e) { next(e); }
  },
  getById: async (req, res, next) => {
    try { const d = await prescriptionService.getById(req.params.id); res.json({ success: true, data: d }); } catch (e) { next(e); }
  },
  create: async (req, res, next) => {
    try { const d = await prescriptionService.create(req.body); res.status(201).json({ success: true, data: d }); } catch (e) { next(e); }
  },
  update: async (req, res, next) => {
    try { const d = await prescriptionService.update(req.params.id, req.body); res.json({ success: true, data: d }); } catch (e) { next(e); }
  },
  remove: async (req, res, next) => {
    try { await prescriptionService.delete(req.params.id); res.json({ success: true, message: 'Prescription deleted' }); } catch (e) { next(e); }
  }
};
