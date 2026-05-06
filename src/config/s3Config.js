const {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand
} = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { DO_SPACES_BUCKET, DO_SPACES_REGION } = require('./constant');
const { DO_SPACES_KEY, DO_SPACES_SECRET } = require('./env');

const spacesBucket = DO_SPACES_BUCKET;
const spacesRegion = DO_SPACES_REGION;

const s3Client = new S3Client({
  region: spacesRegion,
  endpoint: 'https://sriapp.sgp1.digitaloceanspaces.com',
  // Path-style avoids SSL hostname mismatches when endpoint already includes bucket
  forcePathStyle: true,
  credentials: {
    accessKeyId: DO_SPACES_KEY,
    secretAccessKey: DO_SPACES_SECRET
  }
});

module.exports = {
  s3Client,
  spacesBucket,
  getSignedUrl,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand
};
