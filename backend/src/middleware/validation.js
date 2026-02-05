import { body, param, query, validationResult } from 'express-validator';

// Middleware to handle validation results
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const firstError = errors.array()[0];
    return res.status(400).json({
      success: false,
      message: firstError.msg,
      errors: errors.array()
    });
  }
  next();
};

// Auth validation rules
export const registerValidation = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
];

export const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

// Team validation rules
export const createTeamValidation = [
  body('name')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Team name must be between 3 and 50 characters'),
  body('game')
    .isIn(['valorant', 'lol', 'csgo', 'overwatch', 'rocket-league'])
    .withMessage('Invalid game'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters')
];

// Tournament validation rules
export const createTournamentValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Tournament name is required'),
  body('game')
    .isIn(['valorant', 'lol', 'csgo', 'overwatch', 'rocket-league'])
    .withMessage('Invalid game'),
  body('prizePool')
    .notEmpty()
    .withMessage('Prize pool is required'),
  body('startDate')
    .isISO8601()
    .withMessage('Invalid start date'),
  body('endDate')
    .isISO8601()
    .withMessage('Invalid end date')
    .custom((endDate, { req }) => {
      if (new Date(endDate) <= new Date(req.body.startDate)) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),
  body('maxTeams')
    .isInt({ min: 2 })
    .withMessage('Maximum teams must be at least 2')
];

// ID validation
export const validateObjectId = (paramName = 'id') => [
  param(paramName)
    .isMongoId()
    .withMessage('Invalid ID format')
];

export default {
  validate,
  registerValidation,
  loginValidation,
  createTeamValidation,
  createTournamentValidation,
  validateObjectId
};
