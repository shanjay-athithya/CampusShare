import { Resource } from '../models/Resource.js';
import { User } from '../models/User.js';
import { v2 as cloudinary } from 'cloudinary';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

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

// POST /api/resources - Create new resource
export const createResource = async (req, res) => {
  try {
    const { title, description, department, subject, semester, fileUrl, filePublicId } = req.body;

    // Validation
    if (!title || !description || !department || !subject || !semester || !fileUrl) {
      return res.status(400).json({
        error: 'Missing required fields: title, description, department, subject, semester, fileUrl'
      });
    }

    // Validate semester is a number
    const semesterNum = parseInt(semester);
    if (isNaN(semesterNum) || semesterNum < 1 || semesterNum > 20) {
      return res.status(400).json({
        error: 'Semester must be a number between 1 and 20'
      });
    }

    // Create resource
    const resource = new Resource({
      title,
      description,
      department,
      subject,
      semester: semesterNum,
      fileUrl,
      filePublicId: filePublicId || undefined,
      uploadedBy: req.user._id,
      upvotes: [],
      downvotes: [],
      downloads: 0
    });

    await resource.save();
    await resource.populate('uploadedBy', 'name email department');

    res.status(201).json({
      message: 'Resource created successfully',
      resource: {
        id: resource._id,
        title: resource.title,
        description: resource.description,
        department: resource.department,
        subject: resource.subject,
        semester: resource.semester,
        fileUrl: resource.fileUrl,
        filePublicId: resource.filePublicId,
        uploadedBy: {
          id: resource.uploadedBy._id,
          name: resource.uploadedBy.name,
          email: resource.uploadedBy.email,
          department: resource.uploadedBy.department
        },
        upvotes: resource.upvotes,
        downvotes: resource.downvotes,
        downloads: resource.downloads,
        createdAt: resource.createdAt
      }
    });

  } catch (error) {
    console.error('Create resource error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        error: 'Validation failed',
        details: errors
      });
    }

    res.status(500).json({
      error: 'Internal server error during resource creation'
    });
  }
};

// GET /api/resources - List resources with pagination and filtering
export const getResources = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      department,
      subject,
      semester,
      sort = 'new'
    } = req.query;

    // Build filter object
    const filter = {};
    if (department) filter.department = new RegExp(department, 'i');
    if (subject) filter.subject = new RegExp(subject, 'i');
    if (semester) filter.semester = parseInt(semester);

    // Build sort object
    let sortObj = {};
    switch (sort) {
      case 'top':
        sortObj = { upvotes: -1, createdAt: -1 };
        break;
      case 'downloads':
        sortObj = { downloads: -1, createdAt: -1 };
        break;
      case 'new':
      default:
        sortObj = { createdAt: -1 };
        break;
    }

    // Calculate pagination
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit))); // Max 50 items per page
    const skip = (pageNum - 1) * limitNum;

    // Get resources with pagination
    const [resources, total] = await Promise.all([
      Resource.find(filter)
        .populate('uploadedBy', 'name email department')
        .sort(sortObj)
        .skip(skip)
        .limit(limitNum),
      Resource.countDocuments(filter)
    ]);

    // Format response
    const formattedResources = resources.map(resource => {
      const baseResource = {
        id: resource._id,
        title: resource.title,
        description: resource.description,
        department: resource.department,
        subject: resource.subject,
        semester: resource.semester,
        fileUrl: resource.fileUrl,
        uploadedBy: {
          id: resource.uploadedBy._id,
          name: resource.uploadedBy.name,
          email: resource.uploadedBy.email,
          department: resource.uploadedBy.department
        },
        upvotes: resource.upvotes.length,
        downvotes: resource.downvotes.length,
        downloads: resource.downloads,
        createdAt: resource.createdAt
      };

      // Add user vote status if authenticated
      if (req.user) {
        baseResource.userHasUpvoted = resource.upvotes.includes(req.user._id);
        baseResource.userHasDownvoted = resource.downvotes.includes(req.user._id);
      }

      return baseResource;
    });

    const totalPages = Math.ceil(total / limitNum);

    res.json({
      resources: formattedResources,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalItems: total,
        itemsPerPage: limitNum,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1
      }
    });

  } catch (error) {
    console.error('Get resources error:', error);
    res.status(500).json({
      error: 'Internal server error during resource retrieval'
    });
  }
};

// GET /api/resources/:id - Get single resource
export const getResource = async (req, res) => {
  try {
    const { id } = req.params;

    const resource = await Resource.findById(id)
      .populate('uploadedBy', 'name email department');

    if (!resource) {
      return res.status(404).json({
        error: 'Resource not found'
      });
    }

    res.json({
      resource: {
        id: resource._id,
        title: resource.title,
        description: resource.description,
        department: resource.department,
        subject: resource.subject,
        semester: resource.semester,
        fileUrl: resource.fileUrl,
        filePublicId: resource.filePublicId,
        uploadedBy: {
          id: resource.uploadedBy._id,
          name: resource.uploadedBy.name,
          email: resource.uploadedBy.email,
          department: resource.uploadedBy.department
        },
        upvotes: resource.upvotes.length,
        downvotes: resource.downvotes.length,
        downloads: resource.downloads,
        createdAt: resource.createdAt
      }
    });

  } catch (error) {
    console.error('Get resource error:', error);
    res.status(500).json({
      error: 'Internal server error during resource retrieval'
    });
  }
};

// DELETE /api/resources/:id - Delete resource
export const deleteResource = async (req, res) => {
  try {
    const { id } = req.params;

    const resource = await Resource.findById(id);
    if (!resource) {
      return res.status(404).json({
        error: 'Resource not found'
      });
    }

    // Check permissions (uploader or admin)
    const isOwner = resource.uploadedBy.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        error: 'Access denied. Only the uploader or admin can delete this resource.'
      });
    }

    // Delete from Cloudinary if public_id exists
    if (useCloudinary && resource.filePublicId) {
      try {
        await cloudinary.uploader.destroy(resource.filePublicId);
      } catch (cloudinaryError) {
        console.error('Cloudinary deletion error:', cloudinaryError);
        // Continue with resource deletion even if Cloudinary fails
      }
    }

    // Delete resource from database
    await Resource.findByIdAndDelete(id);

    res.json({
      message: 'Resource deleted successfully'
    });

  } catch (error) {
    console.error('Delete resource error:', error);
    res.status(500).json({
      error: 'Internal server error during resource deletion'
    });
  }
};

// POST /api/resources/:id/vote - Vote on resource
export const voteResource = async (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.body;
    const userId = req.user._id;

    // Validation
    if (!type || !['up', 'down'].includes(type)) {
      return res.status(400).json({
        error: 'Invalid vote type. Must be "up" or "down"'
      });
    }

    // Find resource
    const resource = await Resource.findById(id);
    if (!resource) {
      return res.status(404).json({
        error: 'Resource not found'
      });
    }

    // Check current vote status
    const hasUpvoted = resource.upvotes.includes(userId);
    const hasDownvoted = resource.downvotes.includes(userId);

    let updateOperation;
    let userHasUpvoted = false;
    let userHasDownvoted = false;

    if (type === 'up') {
      if (hasUpvoted) {
        // Toggle off upvote
        updateOperation = {
          $pull: { upvotes: userId }
        };
        userHasUpvoted = false;
        userHasDownvoted = hasDownvoted;
      } else {
        // Add upvote, remove downvote if exists
        updateOperation = {
          $addToSet: { upvotes: userId },
          $pull: { downvotes: userId }
        };
        userHasUpvoted = true;
        userHasDownvoted = false;
      }
    } else { // type === 'down'
      if (hasDownvoted) {
        // Toggle off downvote
        updateOperation = {
          $pull: { downvotes: userId }
        };
        userHasUpvoted = hasUpvoted;
        userHasDownvoted = false;
      } else {
        // Add downvote, remove upvote if exists
        updateOperation = {
          $addToSet: { downvotes: userId },
          $pull: { upvotes: userId }
        };
        userHasUpvoted = false;
        userHasDownvoted = true;
      }
    }

    // Perform atomic update
    const updatedResource = await Resource.findByIdAndUpdate(
      id,
      updateOperation,
      { new: true }
    );

    res.json({
      message: 'Vote updated successfully',
      upvotes: updatedResource.upvotes.length,
      downvotes: updatedResource.downvotes.length,
      userHasUpvoted,
      userHasDownvoted
    });

  } catch (error) {
    console.error('Vote resource error:', error);
    res.status(500).json({
      error: 'Internal server error during voting'
    });
  }
};

// Generate signed download URL (valid for 1 hour)
export const generateSignedDownloadUrl = (resourceId) => {
  const timestamp = Date.now();
  const data = `${resourceId}:${timestamp}`;
  const signature = crypto
    .createHmac('sha256', process.env.JWT_SECRET)
    .update(data)
    .digest('hex');
  
  return {
    url: `/api/resources/${resourceId}/download?sig=${signature}&t=${timestamp}`,
    expiresAt: new Date(timestamp + 3600000) // 1 hour
  };
};

// GET /api/resources/:id/download - Download resource with counter increment
export const downloadResource = async (req, res) => {
  try {
    const { id } = req.params;
    const { sig, t } = req.query;
    const referer = req.get('Referer') || req.get('Origin');

    // Find resource
    const resource = await Resource.findById(id);
    if (!resource) {
      return res.status(404).json({
        error: 'Resource not found'
      });
    }

    // SECURITY: Validate signed URL if signature provided
    if (sig && t) {
      const timestamp = parseInt(t);
      const now = Date.now();
      
      // Check if URL is expired (1 hour)
      if (now - timestamp > 3600000) {
        return res.status(403).json({
          error: 'Download link has expired'
        });
      }

      // Verify signature
      const data = `${id}:${timestamp}`;
      const expectedSig = crypto
        .createHmac('sha256', process.env.JWT_SECRET)
        .update(data)
        .digest('hex');
      
      if (sig !== expectedSig) {
        return res.status(403).json({
          error: 'Invalid download signature'
        });
      }
    } else {
      // SECURITY: Basic referer validation (optional)
      const allowedDomains = [
        'localhost:3000',
        'localhost:5173', 
        'yourdomain.com'
      ];
      
      if (referer && !allowedDomains.some(domain => referer.includes(domain))) {
        return res.status(403).json({
          error: 'Invalid referer. Download must be initiated from authorized domain.'
        });
      }
    }

    // Atomic increment of download counter
    const updatedResource = await Resource.findByIdAndUpdate(
      id,
      { $inc: { downloads: 1 } },
      { new: true }
    );

    // Handle different file storage types
    if (useCloudinary && resource.filePublicId) {
      // Cloudinary file - redirect to secure URL
      const cloudinaryUrl = cloudinary.url(resource.filePublicId, {
        secure: true,
        sign_url: true,
        expires_at: Math.floor(Date.now() / 1000) + 3600 // 1 hour
      });
      
      return res.redirect(cloudinaryUrl);
    } else {
      // Local file - stream the file
      const filePath = path.join(process.cwd(), 'uploads', path.basename(resource.fileUrl));
      
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({
          error: 'File not found on server'
        });
      }

      // Set appropriate headers for download
      const fileName = path.basename(resource.fileUrl);
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.setHeader('Content-Type', 'application/octet-stream');
      
      // Stream the file
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
      
      fileStream.on('error', (error) => {
        console.error('File stream error:', error);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Error streaming file' });
        }
      });
    }

  } catch (error) {
    console.error('Download resource error:', error);
    res.status(500).json({
      error: 'Internal server error during download'
    });
  }
};

// GET /api/resources/:id/download-url - Get signed download URL (protected)
export const getDownloadUrl = async (req, res) => {
  try {
    const { id } = req.params;

    const resource = await Resource.findById(id);
    if (!resource) {
      return res.status(404).json({
        error: 'Resource not found'
      });
    }

    const signedUrl = generateSignedDownloadUrl(id);
    
    res.json({
      downloadUrl: `${req.protocol}://${req.get('host')}${signedUrl.url}`,
      expiresAt: signedUrl.expiresAt,
      message: 'Use this URL to download the resource. URL expires in 1 hour.'
    });

  } catch (error) {
    console.error('Get download URL error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
};

// GET /api/resources/search?q=...&page=1&limit=10
export const searchResources = async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.max(1, Math.min(50, parseInt(req.query.limit || '10', 10)));
    const skip = (page - 1) * limit;

    if (!q) {
      return res.status(400).json({ error: 'Missing q parameter' });
    }

    const filter = { $text: { $search: q } };
    const projection = {
      score: { $meta: 'textScore' },
      title: 1,
      description: 1,
      department: 1,
      subject: 1,
      semester: 1,
      uploadedBy: 1,
      downloads: 1,
      upvotes: 1,
      downvotes: 1,
      createdAt: 1
    };

    const [items, total] = await Promise.all([
      Resource.find(filter, projection)
        .sort({ score: { $meta: 'textScore' } })
        .populate('uploadedBy', 'name email department')
        .skip(skip)
        .limit(limit)
        .lean(),
      Resource.countDocuments(filter)
    ]);

    res.json({
      resources: items.map(r => ({
        ...r,
        id: r._id,
        upvotes: Array.isArray(r.upvotes) ? r.upvotes.length : (r.upvotes || 0),
        downvotes: Array.isArray(r.downvotes) ? r.downvotes.length : (r.downvotes || 0),
      })),
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit,
        hasNextPage: skip + items.length < total,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('Search resources error:', error);
    res.status(500).json({ error: 'Internal server error during search' });
  }
};
