import { batchService } from './batch.service.js';

export const getAll = async (req, res, next) => {
  try { const r = await batchService.getAll(req.query); res.json({ success: true, ...r }); } catch (e) { next(e); }
};
export const getById = async (req, res, next) => {
  try { const b = await batchService.getById(req.params.id); res.json({ success: true, data: b }); } catch (e) { next(e); }
};
export const create = async (req, res, next) => {
  try { const b = await batchService.create(req.body); res.status(201).json({ success: true, message: 'Batch created', data: b }); } catch (e) { next(e); }
};
export const update = async (req, res, next) => {
  try { const b = await batchService.update(req.params.id, req.body); res.json({ success: true, message: 'Batch updated', data: b }); } catch (e) { next(e); }
};
export const remove = async (req, res, next) => {
  try { await batchService.delete(req.params.id); res.json({ success: true, message: 'Batch deleted' }); } catch (e) { next(e); }
};
export const getExpiring = async (req, res, next) => {
  try { const days = parseInt(req.query.days, 10) || 30; const b = await batchService.getExpiring(days); res.json({ success: true, data: b }); } catch (e) { next(e); }
};
