const { body } = require('express-validator');

const EMAIL_RULES = body('email')
  .trim()
  .isEmail()
  .withMessage('Valid email is required')
  .normalizeEmail();

const registerStartValidation = [
  body('name').trim().notEmpty().withMessage('Name is required')
    .isLength({ max: 100 })
    .withMessage('Name cannot exceed 100 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Name can only contain letters and spaces'),
  EMAIL_RULES,
  body('agreeToTerms')
    .isBoolean()
    .withMessage('agreeToTerms must be true or false')
    .custom((value) => value === true)
    .withMessage('You must agree to the terms and privacy policy'),
  body('subscribeToMarketing')
    .optional()
    .isBoolean()
    .withMessage('subscribeToMarketing must be true or false')
];

const verifyOtpValidation = [
  EMAIL_RULES,
  body('otp')
    .trim()
    .isLength({ min: 4, max: 6 })
    .withMessage('OTP must be between 4 and 6 digits')
    .isNumeric()
    .withMessage('OTP must be numeric')
];

const emailOnlyValidation = [EMAIL_RULES];

const businessOwnerStepValidation = {
  step3: [
    EMAIL_RULES,
    body('whatBringsYouHere')
      .trim()
      .notEmpty()
      .withMessage('whatBringsYouHere is required')
  ],
  step4: [
    EMAIL_RULES,
    body('planId').trim().notEmpty().withMessage('planId is required')
  ],
  step5: [
    EMAIL_RULES,
    body('paymentStatus')
      .trim()
      .equals('completed')
      .withMessage('paymentStatus must be completed'),
    body('transactionId')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('transactionId cannot be empty')
  ],
  step6: [
    EMAIL_RULES,
    body('howDidYouHearAboutUs')
      .trim()
      .notEmpty()
      .withMessage('howDidYouHearAboutUs is required')
  ],
  step7: [
    EMAIL_RULES,
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long')
      .matches(/[a-z]/)
      .withMessage('Password must contain at least one lowercase letter')
      .matches(/[A-Z]/)
      .withMessage('Password must contain at least one uppercase letter')
      .matches(/\d/)
      .withMessage('Password must contain at least one number')
      .matches(/[@$!%*?&]/)
      .withMessage('Password must contain at least one special character'),
    body('confirmPassword')
      .custom((value, { req }) => value === req.body.password)
      .withMessage('Passwords do not match')
  ],
  step8: [
    EMAIL_RULES,
    body('businessName')
      .trim()
      .notEmpty()
      .withMessage('businessName is required'),
    body('businessType')
      .trim()
      .notEmpty()
      .withMessage('businessType is required'),
    body('phoneNumberCountryCode')
      .trim()
      .notEmpty()
      .withMessage('phoneNumberCountryCode is required'),
    body('phoneNumber')
      .trim()
      .notEmpty()
      .withMessage('phoneNumber is required'),
    body('timeZone')
      .trim()
      .notEmpty()
      .withMessage('timeZone is required'),
    body('address')
      .trim()
      .notEmpty()
      .withMessage('address is required'),
    body('state')
      .trim()
      .notEmpty()
      .withMessage('state is required'),
    body('city')
      .trim()
      .notEmpty()
      .withMessage('city is required'),
    body('zipCode')
      .trim()
      .notEmpty()
      .withMessage('zipCode is required')
  ]
};

const loginValidation = [
  EMAIL_RULES,
  body('password').notEmpty().withMessage('Password is required')
];

const forgotPasswordValidation = [EMAIL_RULES];

const forgotPasswordOtpValidation = [
  EMAIL_RULES,
  body('otp')
    .trim()
    .isLength({ min: 4, max: 6 })
    .withMessage('OTP must be between 4 and 6 digits')
    .isNumeric()
    .withMessage('OTP must be numeric')
];

const resetPasswordValidation = [
  EMAIL_RULES,
  body('otp')
    .trim()
    .isLength({ min: 4, max: 6 })
    .withMessage('OTP must be between 4 and 6 digits')
    .isNumeric()
    .withMessage('OTP must be numeric'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters long')
    .matches(/[a-z]/)
    .withMessage('New password must contain at least one lowercase letter')
    .matches(/[A-Z]/)
    .withMessage('New password must contain at least one uppercase letter')
    .matches(/\d/)
    .withMessage('New password must contain at least one number')
    .matches(/[@$!%*?&]/)
    .withMessage('New password must contain at least one special character'),
  body('confirmPassword')
    .custom((value, { req }) => value === req.body.newPassword)
    .withMessage('Passwords do not match')
];

module.exports = {
  registerStartValidation,
  verifyOtpValidation,
  emailOnlyValidation,
  businessOwnerStepValidation,
  loginValidation,
  forgotPasswordValidation,
  forgotPasswordOtpValidation,
  resetPasswordValidation
};
