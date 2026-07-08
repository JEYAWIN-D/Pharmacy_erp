import { rackService } from './rack.service.js';
export const getAll = async (req, res, next) => {
  try { const r = await rackService.getAll(); res.json({ success: true, data: r }); } catch (e) { next(e); }
};
export const getById = async (req, res, next) => {
  try { const r = await rackService.getById(req.params.id); res.json({ success: true, data: r }); } catch (e) { next(e); }
};
export const create = async (req, res, next) => {
  try { const r = await rackService.create(req.body); res.status(201).json({ success: true, data: r }); } catch (e) { next(e); }
};
export const update = async (req, res, next) => {
  try { const r = await rackService.update(req.params.id, req.body); res.json({ success: true, data: r }); } catch (e) { next(e); }
};
export const remove = async (req, res, next) => {
  try { await rackService.delete(req.params.id); res.json({ success: true, message: 'Rack deleted' }); } catch (e) { next(e); }
};
export const createCompartment = async (req, res, next) => {
  try { const c = await rackService.createCompartment(req.params.id, req.body); res.status(201).json({ success: true, data: c }); } catch (e) { next(e); }
};
export const transferStock = async (req, res, next) => {
  try { const t = await rackService.transferStock(req.body); res.status(201).json({ success: true, data: t }); } catch (e) { next(e); }
};
export const allocateStock = async (req, res, next) => {
  try { const r = await rackService.allocateStock(req.body); res.status(201).json({ success: true, data: r }); } catch (e) { next(e); }
};
