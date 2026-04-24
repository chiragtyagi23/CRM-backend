const fs = require("fs");
const path = require("path");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { env } = require("../config/env");

let client;

function isS3MediaEnabled() {
  return Boolean(env.s3?.bucket && env.s3?.region);
}

function getS3Client() {
  if (!isS3MediaEnabled()) return null;
  if (!client) {
    client = new S3Client({ region: env.s3.region });
  }
  return client;
}

function buildObjectKey(filename) {
  const prefix = String(env.s3.keyPrefix || "media").replace(/^\/+|\/+$/g, "");
  const safe = String(filename || "file").replace(/^\/+/, "");
  return prefix ? `${prefix}/${safe}` : safe;
}

function buildPublicUrl(objectKey) {
  const key = objectKey.split("/").map(encodeURIComponent).join("/");
  if (env.s3.publicBaseUrl) {
    return `${env.s3.publicBaseUrl}/${key}`;
  }
  const { bucket, region } = env.s3;
  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
}

/**
 * If S3 is configured, streams the file to the bucket, deletes the local file, and returns the public URL.
 * Otherwise returns a relative `/uploads/...` URL and leaves the file on disk.
 * @param {{ skipS3?: boolean }} opts - When true, never uploads to S3 (draft while editing; promote on a later final upload).
 */
async function maybeUploadToS3AndGetUrl({ localPath, filename, contentType, size, skipS3 }) {
  const stat = fs.statSync(localPath);
  const resolvedSize = typeof size === "number" ? size : stat.size;

  if (!isS3MediaEnabled() || skipS3) {
    return {
      url: `/uploads/${filename}`,
      filename,
      mimetype: contentType,
      size: resolvedSize,
    };
  }

  const objectKey = buildObjectKey(filename);
  const s3 = getS3Client();
  const body = fs.createReadStream(localPath);

  try {
    await s3.send(
      new PutObjectCommand({
        Bucket: env.s3.bucket,
        Key: objectKey,
        Body: body,
        ContentType: contentType || "application/octet-stream",
      }),
    );
  } finally {
    try {
      body.destroy();
    } catch {
      /* ignore */
    }
  }

  try {
    fs.unlinkSync(localPath);
  } catch {
    /* ignore */
  }

  return {
    url: buildPublicUrl(objectKey),
    filename: path.basename(objectKey),
    mimetype: contentType,
    size: resolvedSize,
  };
}

module.exports = {
  isS3MediaEnabled,
  maybeUploadToS3AndGetUrl,
};
