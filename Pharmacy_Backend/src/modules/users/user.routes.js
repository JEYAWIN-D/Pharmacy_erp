import express from 'express';

import {
	getUsers,
	getUserById,
	createUser,
	updateUser,
	deleteUser
} from './user.controller.js';

import {
	createUserValidation,
	updateUserValidation,
	getUserByIdValidation
} from './user.validation.js';

const router = express.Router();

router.get('/', getUsers);

router.get(
	'/:id',
	getUserByIdValidation,
	getUserById
);

router.post(
	'/',
	createUserValidation,
	createUser
);

router.put(
	'/:id',
	updateUserValidation,
	updateUser
);

router.delete(
	'/:id',
	getUserByIdValidation,
	deleteUser
);

export default router;
