const {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand
} = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const {
  DO_SPACES_BUCKET,
  DO_SPACES_ROOT_FOLDER,
  DO_SPACES_BUCKET_URL,
  DO_SPACES_BUCKET_URL_CDN,
  DO_SPACES_KEY,
  DO_SPACES_REGION,
  DO_SPACES_SECRET
} = require('./env');

const spacesBucket = DO_SPACES_BUCKET;
const spacesRegion = DO_SPACES_REGION;
const spacesBucketUrl =
  DO_SPACES_BUCKET_URL_CDN ||
  DO_SPACES_BUCKET_URL ||
  `https://${spacesBucket}.${spacesRegion}.digitaloceanspaces.com`;
const spacesEndpointUrl =
  DO_SPACES_BUCKET_URL || `https://${spacesBucket}.${spacesRegion}.digitaloceanspaces.com`;
const spacesRootFolder = (DO_SPACES_ROOT_FOLDER || '').replace(/^\/+|\/+$/g, '');

const s3Client = new S3Client({
  region: spacesRegion,
  endpoint: `https://${spacesRegion}.digitaloceanspaces.com`,
  credentials: {
    accessKeyId: DO_SPACES_KEY,
    secretAccessKey: DO_SPACES_SECRET
  }
});

module.exports = {
  s3Client,
  spacesBucket,
  spacesBucketUrl,
  spacesEndpointUrl,
  spacesRootFolder,
  getSignedUrl,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand
};
