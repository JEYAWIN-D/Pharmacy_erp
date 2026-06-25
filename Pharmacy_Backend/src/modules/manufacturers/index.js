import express from 'express';
import { getAll, getById, create, update, remove } from './manufacturer.controller.js';
import { authenticate } from '../../shared/middleware/authenticate.js';

const router = express.Router();
router.use(authenticate);
router.get('/', getAll);
router.get('/:id', getById);
router.post('/', create);
router.put('/:id', update);
router.delete('/:id', remove);
export default router;
