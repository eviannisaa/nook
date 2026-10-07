const fs = require("fs");
const path = require("path");
const Minio = require("minio");

// Tempat menyimpan foto kontak. Kalau MINIO_ENDPOINT diisi, foto masuk ke
// bucket MinIO (atau layanan sejenis, seperti S3). Jadi app tidak butuh
// disk, karena host seperti Vercel tidak bisa menulis ke disk. Kalau
// kosong, foto disimpan di public/uploads, untuk dipakai di komputer ini.
// Foto tidak pernah bisa dibuka langsung dari luar. App cuma mengirimnya
// ke orang yang boleh melihat.
const UPLOAD_DIR = path.join(__dirname, "..", "public", "uploads");

const CONTENT_TYPES = { ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp", ".gif": "image/gif" };
const contentType = (name) => CONTENT_TYPES[path.extname(name)] || "application/octet-stream";

// MINIO_ENDPOINT berisi alamat lengkap, misalnya https://minio.example.com
// atau http://127.0.0.1:9000
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

  // bucket dibuat (privat) saat pertama dipakai. Kalau gagal, dicoba lagi
  // di upload berikutnya
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
    // isi foto untuk dikirim, atau null kalau fotonya tidak ada
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
