import { manufacturerService } from './manufacturer.service.js';

export const getAll = async (req, res, next) => {
  try {
    const result = await manufacturerService.getAll(req.query);
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
};

export const getById = async (req, res, next) => {
  try {
    const m = await manufacturerService.getById(req.params.id);
    res.json({ success: true, data: m });
  } catch (err) { next(err); }
};

export const create = async (req, res, next) => {
  try {
    const m = await manufacturerService.create(req.body, req.user?.userId);
    res.status(201).json({ success: true, message: 'Manufacturer created', data: m });
  } catch (err) { next(err); }
};

export const update = async (req, res, next) => {
  try {
    const m = await manufacturerService.update(req.params.id, req.body, req.user?.userId);
    res.json({ success: true, message: 'Manufacturer updated', data: m });
  } catch (err) { next(err); }
};

export const remove = async (req, res, next) => {
  try {
    await manufacturerService.delete(req.params.id, req.user?.userId);
    res.json({ success: true, message: 'Manufacturer deleted' });
  } catch (err) { next(err); }
};
