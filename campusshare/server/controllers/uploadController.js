import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v2 as cloudinary } from 'cloudinary';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure Cloudinary if env present
const useCloudinary = String(process.env.USE_CLOUDINARY || '').toLowerCase() === 'true';
if (useCloudinary) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

// Helper: remove local file
function safeUnlink(filePath) {
  try {
    fs.existsSync(filePath) && fs.unlinkSync(filePath);
  } catch (_) {
    // ignore
  }
}

// POST /api/upload
export const handleUpload = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const localPath = req.file.path;

    if (useCloudinary) {
      // Upload to Cloudinary as a raw file (supports many formats) or auto
      try {
        const result = await cloudinary.uploader.upload(localPath, {
          resource_type: 'auto',
          folder: 'campusshare/uploads',
        });

        // Cleanup local temp
        safeUnlink(localPath);

        return res.status(201).json({
          message: 'File uploaded to Cloudinary',
          secure_url: result.secure_url,
          public_id: result.public_id,
        });
      } catch (err) {
        safeUnlink(localPath);
        return res.status(500).json({ error: 'Cloudinary upload failed' });
      }
    }

    // Local storage option
    const publicUrl = `${req.protocol}://${req.get('host')}/uploads/${path.basename(localPath)}`;
    return res.status(201).json({
      message: 'File uploaded',
      fileUrl: publicUrl,
      filename: path.basename(localPath),
    });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error during upload' });
  }
};

export default handleUpload;


