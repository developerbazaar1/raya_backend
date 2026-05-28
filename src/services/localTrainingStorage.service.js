const crypto = require('crypto');
const path = require('path');
const {
  GetObjectCommand,
  PutObjectCommand,
  s3Client,
  spacesBucket,
  spacesBucketUrl,
  spacesRootFolder
} = require('../config/s3Config');

const safeFileName = (fileName = 'source') => {
  const extension = path.extname(fileName).toLowerCase();
  const baseName = path
    .basename(fileName, extension)
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  return `${baseName || 'source'}-${crypto.randomBytes(6).toString('hex')}${extension}`;
};

const uploadTrainingFileToSpaces = async (trainingId, file) => {
  const fileName = safeFileName(file.originalname);
  const key = `${spacesRootFolder}/trainings/${trainingId}/source/${fileName}`;

  console.log(
    `[training:spaces] uploading source file trainingId=${trainingId} key=${key} mime=${file.mimetype} size=${file.size}`
  );

  await s3Client.send(
    new PutObjectCommand({
      Bucket: spacesBucket,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'public-read'
    })
  );

  return {
    key,
    url: `${spacesBucketUrl}/${key}`,
    fileName: file.originalname,
    mimeType: file.mimetype,
    sizeBytes: file.size
  };
};

const uploadTrainingTextToSpaces = async (trainingId, text, fileName = 'source.txt') => {
  const key = `${spacesRootFolder}/trainings/${trainingId}/source/${fileName}`;

  console.log(
    `[training:spaces] uploading text trainingId=${trainingId} key=${key} chars=${text.length}`
  );

  await s3Client.send(
    new PutObjectCommand({
      Bucket: spacesBucket,
      Key: key,
      Body: Buffer.from(text, 'utf8'),
      ContentType: 'text/plain; charset=utf-8',
      ACL: 'private'
    })
  );

  return {
    key,
    url: `${spacesBucketUrl}/${key}`
  };
};

const streamToString = async (stream) => {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return Buffer.concat(chunks).toString('utf8');
};

const readTrainingTextFromSpaces = async (key) => {
  console.log(`[training:spaces] reading text key=${key}`);

  const response = await s3Client.send(
    new GetObjectCommand({
      Bucket: spacesBucket,
      Key: key
    })
  );

  const text = await streamToString(response.Body);
  console.log(`[training:spaces] read text complete key=${key} chars=${text.length}`);
  return text;
};

module.exports = {
  readTrainingTextFromSpaces,
  uploadTrainingFileToSpaces,
  uploadTrainingTextToSpaces
};
