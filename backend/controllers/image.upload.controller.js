const { PutObjectCommand } = require('@aws-sdk/client-s3');
const s3 = require('../config/s3');

exports.uploadImage = async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No file uploaded' });

    const params = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: `${Date.now()}-${file.originalname}`,
      Body: file.buffer,
      ContentType: file.mimetype,
    //   ACL: 'public-read', // optional
    };

    await s3.send(new PutObjectCommand(params));

    const fileUrl = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${params.Key}`;
    res.status(200).json({ message: 'Upload successful', url: fileUrl });
  }catch (err) {
  console.error('S3 Upload Error:', err);
  res.status(500).json({ error: 'Upload failed', details: err.message });
}

};
