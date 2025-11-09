// backend/src/config/cloudinary.js
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure Cloudinary Storage for Multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    // Determine folder based on document type
    let folder = 'cgeip/documents';
    
    if (file.fieldname === 'idCard') folder = 'cgeip/documents/id-cards';
    else if (file.fieldname === 'transcript') folder = 'cgeip/documents/transcripts';
    else if (file.fieldname === 'certificate') folder = 'cgeip/documents/certificates';
    else if (file.fieldname === 'completionCertificate') folder = 'cgeip/documents/completion';
    
    return {
      folder: folder,
      allowed_formats: ['pdf', 'jpg', 'jpeg', 'png'],
      resource_type: 'auto',
      public_id: `${Date.now()}-${file.originalname.split('.')[0]}`
    };
  }
});

// File filter to allow only specific file types
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, JPEG, JPG, and PNG are allowed.'), false);
  }
};

// Create multer upload middleware
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Helper function to delete file from Cloudinary
const deleteFile = async (publicId) => {
  try {
    await cloudinary.uploader.destroy(publicId);
    return { success: true };
  } catch (error) {
    console.error('Error deleting file from Cloudinary:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  cloudinary,
  upload,
  deleteFile
};