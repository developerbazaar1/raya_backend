const multer = require('multer');
const { FILE_SIZE, FILE_TYPES } = require('../config/constant');
const AppError = require('../utils/appError');

let fileTypeFromBufferPromise;

const getFileTypeFromBuffer = async () => {
  if (!fileTypeFromBufferPromise) {
    fileTypeFromBufferPromise = import('file-type').then(({ fileTypeFromBuffer }) => fileTypeFromBuffer);
  }

  return fileTypeFromBufferPromise;
};

/**
 * 1. Centralized Upload Configuration Schemas
 * Standardized MIME types are used here because file-type detects actual MIMEs (e.g., 'image/jpeg').
 */
const UPLOAD_SCHEMAS = {
  BUSINESS_OWNER_STEP_8: {
    fields: [
      { name: 'profilePicture', maxCount: 1 },
      { name: 'logo', maxCount: 1 }
    ],
    maxSize: 2 * 1024 * 1024,
    allowedMimes: ['image/jpeg', 'image/png', 'image/jfif', 'image/avif']
  },
  EMPLOYEE_PROFILE_STEP_1: {
    fields: [{ name: 'profilePhoto', maxCount: 1 }],
    allowedMimes: ['image/jpeg', 'image/png', 'image/jfif', 'image/avif']
  },
  BUSINESS_OWNER_SETTINGS: {
    fields: [
      { name: 'logo', maxCount: 1 },
      { name: 'profilePicture', maxCount: 1 }
    ],
    maxSize: 2 * 1024 * 1024,
    allowedMimes: ['image/jpeg', 'image/png', 'image/jfif', 'image/avif']
  },
  TASK_FILES: {
    fields: [{ name: 'attachments', maxCount: 10 }],
    allowedMimes: ['image/jpeg', 'image/png', 'application/pdf', 'application/zip']
  },
  CHAT_ROOM: {
    fields: [{ name: 'chatRoomImage', maxCount: 1 }],
    allowedMimes: ['image/jpeg', 'image/png', 'image/jfif', 'image/avif']
  },
  MEMBER_PROFILE: {
    fields: [{ name: 'userProfile', maxCount: 1 }],
    allowedMimes: ['image/jpeg', 'image/png', 'image/jfif', 'image/avif']
  }
};

/**
 * 2. The Factory Engine
 * Returns an array of middlewares: [ Multer parser, Deep Magic-Byte Validator ]
 */
const createSecureUploadMiddleware = (schemaKey) => {
  const schema = UPLOAD_SCHEMAS[schemaKey];

  if (!schema) {
    throw new Error(`Upload Schema Engine: "${schemaKey}" is not a registered configuration.`);
  }

  const finalSizeLimit = schema.maxSize || FILE_SIZE;
  const finalAllowedMimes = schema.allowedMimes || FILE_TYPES;

  // Phase A: Use multer solely to grab files and enforce size boundaries
  const multerParser = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: finalSizeLimit }
  }).fields(schema.fields);

  // Phase B: The Magic Byte Deep-Scanner Middleware
  const magicByteValidator = async (req, res, next) => {
    if (!req.files) return next();

    try {
      // Flatten all incoming files across fields into a single list for validation
      const allFiles = Object.values(req.files).flat();

      for (const file of allFiles) {
        // Inspect the actual binary buffer array to extract real file properties
        const fileTypeFromBuffer = await getFileTypeFromBuffer();
        const detectedType = await fileTypeFromBuffer(file.buffer);

        // Fail-safe: If file-type returns undefined, it's an unrecognized format/malicious binary
        if (!detectedType) {
          return next(new AppError(`Invalid file format content detected in ${file.fieldname}.`, 400));
        }

        // Verify if the true MIME type matches our allowed criteria
        const isMimeValid = finalAllowedMimes.includes(detectedType.mime);

        if (!isMimeValid) {
          return next(new AppError(`Unsupported file type (${detectedType.ext}) for ${schemaKey.toLowerCase().replace(/_/g, ' ')}.`, 400));
        }

        // Optional but secure: Mutate the file object to reflect its TRUE audited mime/extension
        file.mimetype = detectedType.mime;
      }

      next();
    } catch (error) {
      console.error('Error during file validation:', error);
      next(new AppError('An error occurred while inspecting the uploaded files.', 500));
    }
  };

  // Express allows passing arrays of middlewares sequentially
  return [multerParser, magicByteValidator];
};

/**
 * 3. Instantiating the Middleware Chains via the Factory
 */
const uploadBusinessOwnerStep8Files = createSecureUploadMiddleware('BUSINESS_OWNER_STEP_8');
const uploadEmployeeProfileStep1Files = createSecureUploadMiddleware('EMPLOYEE_PROFILE_STEP_1');
const uploadBusinessOwnerSettingsFiles = createSecureUploadMiddleware('BUSINESS_OWNER_SETTINGS');
const uploadTaskFiles = createSecureUploadMiddleware('TASK_FILES');
const uploadChatRoomFiles = createSecureUploadMiddleware('CHAT_ROOM');
const uploadMemberProfile = createSecureUploadMiddleware('MEMBER_PROFILE');

module.exports = {
  uploadBusinessOwnerStep8Files,
  uploadEmployeeProfileStep1Files,
  uploadBusinessOwnerSettingsFiles,
  uploadTaskFiles,
  uploadMemberProfile,
  uploadChatRoomFiles
};
