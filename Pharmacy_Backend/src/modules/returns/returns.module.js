import prisma from '../../config/prisma.js';
import { AppError } from '../../shared/errors/AppError.js';

// ─── RETURNS MODULE ───────────────────────────────────────────────────────────

const returnsRepo = {
  // Patient Returns
  createPatientReturn: async (data) => {
    const { items, ...rest } = data;
    return prisma.patientReturn.create({
      data: { ...rest, items: { create: items || [] } },
      include: { items: true }
    });
  },
  findAllPatientReturns: async () => prisma.patientReturn.findMany({
    include: { items: true, bill: true }, orderBy: { createdAt: 'desc' }
  }),
  findPatientReturnById: async (id) => prisma.patientReturn.findUnique({
    where: { id: parseInt(id) }, include: { items: true }
  }),

  // Supplier Returns
  createSupplierReturn: async (data) => {
    const { items, ...rest } = data;
    return prisma.supplierReturn.create({
      data: { ...rest, items: { create: items || [] } },
      include: { items: true }
    });
  },
  findAllSupplierReturns: async () => prisma.supplierReturn.findMany({
    include: { items: true, supplier: true }, orderBy: { createdAt: 'desc' }
  }),
  updateSupplierReturn: async (id, data) => prisma.supplierReturn.update({ where: { id: parseInt(id) }, data })
};

export const returnsController = {
  // Patient
  getAllPatient: async (req, res, next) => {
    try { const d = await returnsRepo.findAllPatientReturns(); res.json({ success: true, data: d }); } catch (e) { next(e); }
  },
  createPatient: async (req, res, next) => {
    try { const d = await returnsRepo.createPatientReturn(req.body); res.status(201).json({ success: true, data: d }); } catch (e) { next(e); }
  },

  // Supplier
  getAllSupplier: async (req, res, next) => {
    try { const d = await returnsRepo.findAllSupplierReturns(); res.json({ success: true, data: d }); } catch (e) { next(e); }
  },
  createSupplier: async (req, res, next) => {
    try { const d = await returnsRepo.createSupplierReturn(req.body); res.status(201).json({ success: true, data: d }); } catch (e) { next(e); }
  },
  updateSupplier: async (req, res, next) => {
    try { const d = await returnsRepo.updateSupplierReturn(req.params.id, req.body); res.json({ success: true, data: d }); } catch (e) { next(e); }
  }
};
