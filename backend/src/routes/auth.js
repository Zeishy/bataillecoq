import express from 'express';
import {
  register,
  login,
  getMe,
  linkAccount,
  updateProfile
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import {
  registerValidation,
  loginValidation,
  validate
} from '../middleware/validation.js';

const router = express.Router();

router.post('/register', registerValidation, validate, register);
router.post('/login', loginValidation, validate, login);
router.get('/me', protect, getMe);
router.put('/link-account', protect, linkAccount);
router.put('/profile', protect, updateProfile);

export default router;
