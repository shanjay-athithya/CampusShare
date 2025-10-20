import mongoose from 'mongoose';

const { Schema, Types } = mongoose;

// Academic resource uploaded by users (notes, papers, etc.)
const resourceSchema = new Schema(
    {
        // Resource title
        title: {
            type: String,
            required: [true, 'Title is required'],
            trim: true,
            maxlength: [200, 'Title must be at most 200 characters long'],
        },
        // Short description/summary
        description: {
            type: String,
            required: [true, 'Description is required'],
            trim: true,
            maxlength: [2000, 'Description must be at most 2000 characters long'],
        },
        // Department this resource belongs to
        department: {
            type: String,
            required: [true, 'Department is required'],
            trim: true,
            maxlength: [100, 'Department must be at most 100 characters long'],
        },
        // Subject/course name
        subject: {
            type: String,
            required: [true, 'Subject is required'],
            trim: true,
            maxlength: [100, 'Subject must be at most 100 characters long'],
        },
        // Semester number (e.g., 1..10)
        semester: {
            type: Number,
            required: [true, 'Semester is required'],
            min: [1, 'Semester must be at least 1'],
            max: [20, 'Semester must be at most 20'],
        },
        // URL to the uploaded file (S3/Cloudinary/etc.)
        fileUrl: {
            type: String,
            required: [true, 'fileUrl is required'],
            trim: true,
        },
        // Optional: Cloudinary public ID (if used)
        filePublicId: {
            type: String,
            default: undefined,
            trim: true,
        },
        // Uploader reference
        uploadedBy: {
            type: Types.ObjectId,
            ref: 'User',
            required: [true, 'uploadedBy is required'],
        },
        // Voting arrays store user IDs
        upvotes: [{ type: Types.ObjectId, ref: 'User' }],
        downvotes: [{ type: Types.ObjectId, ref: 'User' }],
        // Download counter
        downloads: {
            type: Number,
            default: 0,
            min: [0, 'downloads cannot be negative'],
        },
    },
    {
        timestamps: { createdAt: true, updatedAt: true },
    }
);

export const Resource = mongoose.models.Resource || mongoose.model('Resource', resourceSchema);

export default Resource;

// Text index for search (created once; safe on repeated loads)
try {
  resourceSchema.index(
    { title: 'text', description: 'text', subject: 'text', department: 'text' },
    { name: 'resource_text_index', weights: { title: 10, description: 5, subject: 4, department: 2 } }
  );
} catch {}


