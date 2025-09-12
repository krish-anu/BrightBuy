const express = require('express');
const multer = require('multer');
const { uploadImage } = require('../controllers/image.upload.controller');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/upload', upload.single('image'), uploadImage);

module.exports = router;
