const multer = require('multer');
const { FILE_SIZE, FILE_TYPES } = require('../config/constant');
const AppError = require('../utils/appError');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: FILE_SIZE
  },
  fileFilter: (req, file, cb) => {
    const extension = (file.originalname.split('.').pop() || '').toLowerCase();
    const mimeExtension = (file.mimetype.split('/')[1] || '').toLowerCase();
    const isAllowed = FILE_TYPES.includes(extension) || FILE_TYPES.includes(mimeExtension);

    if (!isAllowed) {
      cb(new AppError('Unsupported file type.', 400));
      return;
    }

    cb(null, true);
  }
});

const uploadBusinessOwnerStep8Files = upload.fields([
  { name: 'logo', maxCount: 1 },
  { name: 'profilePicture', maxCount: 1 }
]);

const uploadEmployeeProfileStep1Files = upload.fields([{ name: 'profilePhoto', maxCount: 1 }]);

const uploadBusinessOwnerSettingsFiles = upload.fields([
  { name: 'logo', maxCount: 1 },
  { name: 'profilePicture', maxCount: 1 }
]);

module.exports = {
  uploadBusinessOwnerStep8Files,
  uploadEmployeeProfileStep1Files,
  uploadBusinessOwnerSettingsFiles
};
