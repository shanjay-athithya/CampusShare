import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const { Schema } = mongoose;

// User accounts for accessing CampusShare
const userSchema = new Schema(
    {
        // Display name for the user
        name: {
            type: String,
            required: [true, 'Name is required'],
            trim: true,
            minlength: [2, 'Name must be at least 2 characters long'],
            maxlength: [100, 'Name must be at most 100 characters long'],
        },
        // Unique email used for login and communication
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            lowercase: true,
            trim: true,
            match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email'],
        },
        // Hashed password (never store plaintext)
        password: {
            type: String,
            required: [true, 'Password is required'],
            minlength: [6, 'Password must be at least 6 characters long'],
        },
        // Department (e.g., Computer Science)
        department: {
            type: String,
            required: [true, 'Department is required'],
            trim: true,
            maxlength: [100, 'Department must be at most 100 characters long'],
        },
        // Role for authorization (default: user)
        role: {
            type: String,
            enum: ['user', 'admin'],
            default: 'user',
        },
    },
    {
        timestamps: { createdAt: true, updatedAt: true },
    }
);

// Hash password before saving if modified or new
userSchema.pre('save', async function hashPasswordIfNeeded(next) {
    if (!this.isModified('password')) return next();
    try {
        const saltRounds = 10;
        const salt = await bcrypt.genSalt(saltRounds);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (err) {
        next(err);
    }
});

// Convenience method to compare password during login
userSchema.methods.verifyPassword = async function verifyPassword(plainText) {
    return bcrypt.compare(plainText, this.password);
};

export const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User;


