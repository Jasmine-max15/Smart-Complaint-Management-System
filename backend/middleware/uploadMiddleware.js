const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads folder exists
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `complaint-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedExtensions = /jpeg|jpg|png|webp|gif/;
  const ext = path.extname(file.originalname).toLowerCase();
  const mimeType = allowedExtensions.test(file.mimetype);
  const extName = allowedExtensions.test(ext);

  if (mimeType && extName) {
    return cb(null, true);
  }
  cb(new Error('Only image files (JPG, JPEG, PNG, WEBP, GIF) are allowed!'));
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  fileFilter: fileFilter,
});

module.exports = upload;

