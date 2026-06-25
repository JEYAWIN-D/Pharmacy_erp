import prisma from '../../config/prisma.js';
import { AppError } from '../../shared/errors/AppError.js';

// ─── PURCHASE REPOSITORY ─────────────────────────────────────────────────────
const purchaseRepo = {
  // Purchase Requests
  createPR: async (data) => {
    const { items, ...rest } = data;
    return prisma.purchaseRequest.create({
      data: { ...rest, items: { create: items || [] } },
      include: { items: { include: { medicine: true } } }
    });
  },
  findAllPRs: async () => prisma.purchaseRequest.findMany({
    include: { items: { include: { medicine: true } } }, orderBy: { createdAt: 'desc' }
  }),
  findPRById: async (id) => prisma.purchaseRequest.findUnique({
    where: { id }, include: { items: { include: { medicine: true } } }
  }),
  updatePR: async (id, data) => prisma.purchaseRequest.update({ where: { id }, data }),

  // Purchase Orders
  createPO: async (data) => {
    const { items, ...rest } = data;
    return prisma.purchaseOrder.create({
      data: { ...rest, items: { create: items || [] } },
      include: { items: true, supplier: true }
    });
  },
  findAllPOs: async () => prisma.purchaseOrder.findMany({
    include: { items: { include: { medicine: true } }, supplier: true }, orderBy: { createdAt: 'desc' }
  }),
  findPOById: async (id) => prisma.purchaseOrder.findUnique({
    where: { id }, include: { items: { include: { medicine: true } }, supplier: true }
  }),
  updatePO: async (id, data) => prisma.purchaseOrder.update({ where: { id }, data }),

  // Goods Receipts
  createGRN: async (data) => {
    const { items, ...rest } = data;
    return prisma.goodsReceipt.create({
      data: { ...rest, items: { create: items || [] } },
      include: { items: true }
    });
  },
  findAllGRNs: async () => prisma.goodsReceipt.findMany({
    include: { items: true }, orderBy: { createdAt: 'desc' }
  }),
  findGRNById: async (id) => prisma.goodsReceipt.findUnique({
    where: { id }, include: { items: true }
  })
};

// ─── PURCHASE SERVICE ────────────────────────────────────────────────────────
export const purchaseService = {
  // PRs
  createPR: async (data) => purchaseRepo.createPR(data),
  getAllPRs: async () => purchaseRepo.findAllPRs(),
  getPRById: async (id) => {
    const p = await purchaseRepo.findPRById(id);
    if (!p) throw new AppError('Purchase Request not found', 404, 'NOT_FOUND');
    return p;
  },
  updatePR: async (id, data) => {
    const p = await purchaseRepo.findPRById(id);
    if (!p) throw new AppError('Purchase Request not found', 404, 'NOT_FOUND');
    return purchaseRepo.updatePR(id, data);
  },

  // POs
  createPO: async (data) => purchaseRepo.createPO(data),
  getAllPOs: async () => purchaseRepo.findAllPOs(),
  getPOById: async (id) => {
    const p = await purchaseRepo.findPOById(id);
    if (!p) throw new AppError('Purchase Order not found', 404, 'NOT_FOUND');
    return p;
  },
  updatePO: async (id, data) => {
    const p = await purchaseRepo.findPOById(id);
    if (!p) throw new AppError('Purchase Order not found', 404, 'NOT_FOUND');
    return purchaseRepo.updatePO(id, data);
  },

  // GRNs
  createGRN: async (data) => purchaseRepo.createGRN(data),
  getAllGRNs: async () => purchaseRepo.findAllGRNs(),
  getGRNById: async (id) => {
    const g = await purchaseRepo.findGRNById(id);
    if (!g) throw new AppError('GRN not found', 404, 'NOT_FOUND');
    return g;
  }
};

// ─── PURCHASE CONTROLLER ─────────────────────────────────────────────────────
export const purchaseController = {
  // Purchase Requests
  getAllPRs: async (req, res, next) => {
    try { const d = await purchaseService.getAllPRs(); res.json({ success: true, data: d }); } catch (e) { next(e); }
  },
  getPRById: async (req, res, next) => {
    try { const d = await purchaseService.getPRById(req.params.id); res.json({ success: true, data: d }); } catch (e) { next(e); }
  },
  createPR: async (req, res, next) => {
    try { const d = await purchaseService.createPR(req.body); res.status(201).json({ success: true, data: d }); } catch (e) { next(e); }
  },
  updatePR: async (req, res, next) => {
    try { const d = await purchaseService.updatePR(req.params.id, req.body); res.json({ success: true, data: d }); } catch (e) { next(e); }
  },

  // Purchase Orders
  getAllPOs: async (req, res, next) => {
    try { const d = await purchaseService.getAllPOs(); res.json({ success: true, data: d }); } catch (e) { next(e); }
  },
  getPOById: async (req, res, next) => {
    try { const d = await purchaseService.getPOById(req.params.id); res.json({ success: true, data: d }); } catch (e) { next(e); }
  },
  createPO: async (req, res, next) => {
    try { const d = await purchaseService.createPO(req.body); res.status(201).json({ success: true, data: d }); } catch (e) { next(e); }
  },
  updatePO: async (req, res, next) => {
    try { const d = await purchaseService.updatePO(req.params.id, req.body); res.json({ success: true, data: d }); } catch (e) { next(e); }
  },

  // GRN
  getAllGRNs: async (req, res, next) => {
    try { const d = await purchaseService.getAllGRNs(); res.json({ success: true, data: d }); } catch (e) { next(e); }
  },
  getGRNById: async (req, res, next) => {
    try { const d = await purchaseService.getGRNById(req.params.id); res.json({ success: true, data: d }); } catch (e) { next(e); }
  },
  createGRN: async (req, res, next) => {
    try { const d = await purchaseService.createGRN(req.body); res.status(201).json({ success: true, data: d }); } catch (e) { next(e); }
  }
};
