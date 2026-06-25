import express from 'express';
import { getAll, getById, create, update, remove, createCompartment, transferStock } from './rack.controller.js';
import { authenticate } from '../../shared/middleware/authenticate.js';
const router = express.Router();
router.use(authenticate);

router.post('/transfer', transferStock);
router.get('/', getAll); 
router.get('/:id', getById); 
router.post('/', create); 
router.put('/:id', update); 
router.delete('/:id', remove);
router.post('/:id/compartments', createCompartment);

export default router;
