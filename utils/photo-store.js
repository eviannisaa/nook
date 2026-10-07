const fs = require("fs");
const path = require("path");
const Minio = require("minio");

// Where contact photos are kept. With MINIO_ENDPOINT set they go to a
// MinIO (or any S3-compatible) bucket, so the app needs no disk of its own
// (a host like Vercel can't write to it); without it they stay in
// public/uploads, for running on this computer. Either way a photo is
// known by its name only and is never public: the app hands it out after
// checking who may see it.
const UPLOAD_DIR = path.join(__dirname, "..", "public", "uploads");

const CONTENT_TYPES = { ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp", ".gif": "image/gif" };
const contentType = (name) => CONTENT_TYPES[path.extname(name)] || "application/octet-stream";

// MINIO_ENDPOINT is a full address, like https://minio.example.com or
// http://127.0.0.1:9000
const minioClient = () => {
  const url = new URL(process.env.MINIO_ENDPOINT);
  const useSSL = url.protocol === "https:";
  return new Minio.Client({
    endPoint: url.hostname,
    port: url.port ? Number(url.port) : useSSL ? 443 : 80,
    useSSL,
    accessKey: process.env.MINIO_ACCESS_KEY,
    secretKey: process.env.MINIO_SECRET_KEY,
    region: process.env.MINIO_REGION || "us-east-1",
  });
};

const minioStore = () => {
  const client = minioClient();
  const bucket = process.env.MINIO_BUCKET || "nook-uploads";
  const region = process.env.MINIO_REGION || "us-east-1";

  // the bucket is made (private) on first use; a failed try is tried again
  let ready;
  const bucketReady = () => {
    ready ||= client
      .bucketExists(bucket)
      .then((exists) => exists || client.makeBucket(bucket, region))
      .catch((err) => {
        ready = undefined;
        throw err;
      });
    return ready;
  };

  return {
    async save(name, buffer) {
      await bucketReady();
      await client.putObject(bucket, name, buffer, buffer.length, { "Content-Type": contentType(name) });
    },
    async remove(name) {
      await client.removeObject(bucket, name);
    },
    // a readable stream of the photo, or null when there is none
    async open(name) {
      try {
        return await client.getObject(bucket, name);
      } catch (err) {
        if (err.code === "NoSuchKey" || err.code === "NotFound" || err.code === "NoSuchBucket") return null;
        throw err;
      }
    },
  };
};

const diskStore = () => ({
  async save(name, buffer) {
    await fs.promises.writeFile(path.join(UPLOAD_DIR, name), buffer);
  },
  async remove(name) {
    await fs.promises.unlink(path.join(UPLOAD_DIR, name));
  },
  async open(name) {
    const file = path.join(UPLOAD_DIR, name);
    try {
      await fs.promises.access(file);
    } catch {
      return null;
    }
    return fs.createReadStream(file);
  },
});

const store = process.env.MINIO_ENDPOINT ? minioStore() : diskStore();

module.exports = { ...store, contentType };
