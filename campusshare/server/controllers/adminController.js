import Resource from '../models/Resource.js';
import User from '../models/User.js';

// Get all resources with admin details
const getAllResources = async (req, res) => {
  try {
    const { page = 1, limit = 20, sort = 'newest' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let sortOption = {};
    switch (sort) {
      case 'newest':
        sortOption = { createdAt: -1 };
        break;
      case 'oldest':
        sortOption = { createdAt: 1 };
        break;
      case 'most_downloaded':
        sortOption = { downloads: -1 };
        break;
      case 'most_upvoted':
        sortOption = { upvotes: -1 };
        break;
      default:
        sortOption = { createdAt: -1 };
    }

    const resources = await Resource.find()
      .populate('uploadedBy', 'name email department role')
      .sort(sortOption)
      .skip(skip)
      .limit(parseInt(limit));

    const totalResources = await Resource.countDocuments();

    res.json({
      resources,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalResources / parseInt(limit)),
        totalResources,
        hasNextPage: skip + resources.length < totalResources,
        hasPrevPage: parseInt(page) > 1
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch resources' });
  }
};

// Delete a resource (admin only)
const deleteResource = async (req, res) => {
  try {
    const { id } = req.params;
    
    const resource = await Resource.findById(id);
    if (!resource) {
      return res.status(404).json({ error: 'Resource not found' });
    }

    // TODO: If using Cloudinary, delete file from cloud storage
    // if (resource.filePublicId) {
    //   await cloudinary.uploader.destroy(resource.filePublicId);
    // }

    await Resource.findByIdAndDelete(id);
    
    res.json({ message: 'Resource deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete resource' });
  }
};

// Get resource details for admin
const getResourceDetails = async (req, res) => {
  try {
    const { id } = req.params;
    
    const resource = await Resource.findById(id)
      .populate('uploadedBy', 'name email department role createdAt')
      .populate('upvotes', 'name email')
      .populate('downvotes', 'name email');

    if (!resource) {
      return res.status(404).json({ error: 'Resource not found' });
    }

    res.json({ resource });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch resource details' });
  }
};

// Get admin dashboard stats
const getDashboardStats = async (req, res) => {
  try {
    const totalResources = await Resource.countDocuments();
    const totalUsers = await User.countDocuments();
    const totalDownloads = await Resource.aggregate([
      { $group: { _id: null, total: { $sum: '$downloads' } } }
    ]);
    
    const recentResources = await Resource.find()
      .populate('uploadedBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(5);

    const topResources = await Resource.find()
      .populate('uploadedBy', 'name email')
      .sort({ downloads: -1 })
      .limit(5);

    res.json({
      stats: {
        totalResources,
        totalUsers,
        totalDownloads: totalDownloads[0]?.total || 0
      },
      recentResources,
      topResources
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
};

// Get all users (admin only)
const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, role } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let filter = {};
    if (role) {
      filter.role = role;
    }

    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalUsers = await User.countDocuments(filter);

    res.json({
      users,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalUsers / parseInt(limit)),
        totalUsers,
        hasNextPage: skip + users.length < totalUsers,
        hasPrevPage: parseInt(page) > 1
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

// Update user role (admin only)
const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be "user" or "admin"' });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { role },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user, message: 'User role updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user role' });
  }
};

export {
  getAllResources,
  deleteResource,
  getResourceDetails,
  getDashboardStats,
  getAllUsers,
  updateUserRole
};
