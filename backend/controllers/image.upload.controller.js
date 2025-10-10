const { PutObjectCommand } = require('@aws-sdk/client-s3');
const s3 = require('../config/s3');

exports.uploadImage = async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No file uploaded' });

    // read entity info from the request (frontend should send these fields)
    const { entity = 'unknown', entityId = '0' } = req.body || {};

    // build filename: {entity}/{entityId}/{timestamp}_{random}.{ext}
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const originalName = file.originalname || 'file';
    const extMatch = originalName.match(/\.([0-9a-zA-Z]+)(?:\?.*)?$/);
    const ext = extMatch ? extMatch[1] : (file.mimetype.split('/')[1] || 'bin');
    const key = `${entity}/${entityId}/${timestamp}_${randomString}.${ext}`;

    const params = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      // ACL: 'public-read',
    };

    await s3.send(new PutObjectCommand(params));

    const fileUrl = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${params.Key}`;
    res.status(200).json({ message: 'Upload successful', url: fileUrl });
  }catch (err) {
  console.error('S3 Upload Error:', err);
  res.status(500).json({ error: 'Upload failed', details: err.message });
}

};
