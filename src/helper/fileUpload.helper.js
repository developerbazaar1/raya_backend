const crypto = require('crypto');
const path = require('path');
const {
  s3Client,
  spacesBucket,
  PutObjectCommand,
  DeleteObjectCommand
} = require('../config/s3Config');
const { FILE_SIZE, FILE_TYPES, DO_SPACES_BUCKET, DO_SPACES_REGION } = require('../config/constant');
const AppError = require('../utils/appError');

const normalizeExtension = (fileName = '', mimeType = '') => {
  const extFromName = path.extname(fileName).replace('.', '').toLowerCase();
  if (extFromName) {
    return extFromName;
  }

  const mimeExt = mimeType.split('/')[1] || '';
  return mimeExt.toLowerCase();
};

const validateUploadFile = (file) => {
  if (!file) {
    return;
  }

  if (file.size > FILE_SIZE) {
    throw new AppError('Uploaded file is too large.', 413);
  }

  const extension = normalizeExtension(file.originalname, file.mimetype);
  if (!FILE_TYPES.includes(extension)) {
    throw new AppError(`Unsupported file type. Allowed extensions: ${FILE_TYPES.join(', ')}.`, 400);
  }
};

const buildFileMetadata = (file, key) => ({
  url: `https://swannavespace.sfo3.cdn.digitaloceanspaces.com/${DO_SPACES_BUCKET}/${key}`,
  key,
  fileName: file.originalname,
  mimeType: file.mimetype,
  sizeBytes: file.size
});

const uploadFileToSpaces = async (file, folder) => {
  if (!file) {
    return null;
  }

  validateUploadFile(file);

  const extension = normalizeExtension(file.originalname, file.mimetype);
  const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}`;
  const safeBaseName = path
    .basename(file.originalname, path.extname(file.originalname))
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, '-');
  const key = `${folder}/${safeBaseName || 'file'}-${uniqueSuffix}.${extension}`;

  await s3Client.send(
    new PutObjectCommand({
      Bucket: spacesBucket,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'public-read'
    })
  );

  return buildFileMetadata(file, key);
};

const getFileKey = (fileReference) => {
  if (!fileReference) {
    return null;
  }

  if (typeof fileReference === 'string') {
    return fileReference;
  }

  return fileReference.key || null;
};

const cleanupFileFromSpaces = async (fileReference) => {
  const key = getFileKey(fileReference);

  if (!key) {
    return false;
  }

  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: spacesBucket,
      Key: key
    })
  );

  return true;
};

const cleanupFileFromSpacesQuietly = async (fileReference) => {
  try {
    return await cleanupFileFromSpaces(fileReference);
  } catch (error) {
    console.error('Error cleaning up file from Spaces:', error);
    return false;
  }
};

module.exports = {
  uploadFileToSpaces,
  cleanupFileFromSpaces,
  cleanupFileFromSpacesQuietly
};
