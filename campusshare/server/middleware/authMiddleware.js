import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

// Verify JWT token and attach user to request
export const authenticate = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({
                error: 'Access denied. No token provided.'
            });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Find user by ID from token
        const user = await User.findById(decoded.userId).select('-password');
        if (!user) {
            return res.status(401).json({
                error: 'Invalid token. User not found.'
            });
        }

        // Attach user to request
        req.user = user;
        next();

    } catch (error) {
        console.error('Auth middleware error:', error);

        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                error: 'Invalid token.'
            });
        }

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                error: 'Token expired.'
            });
        }

        res.status(500).json({
            error: 'Internal server error during authentication'
        });
    }
};

// Check if user has admin role
export const isAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            error: 'Authentication required'
        });
    }

    if (req.user.role !== 'admin') {
        return res.status(403).json({
            error: 'Access denied. Admin role required.'
        });
    }

    next();
};

// Optional authentication - doesn't fail if no token
export const optionalAuth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (token) {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.userId).select('-password');
            if (user) {
                req.user = user;
            }
        }

        next();
    } catch (error) {
        // Continue without authentication for optional auth
        next();
    }
};
