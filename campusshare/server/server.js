import express from 'express';
import mongoose from 'mongoose';
import { connectDB } from './db.js';
import dotenv from 'dotenv';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import resourceRoutes from './routes/resourceRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import statsRoutes from './routes/statsRoutes.js';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/stats', statsRoutes);

// Serve uploaded files when using local storage option
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check route
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

// Database connection test
app.get('/api/test-db', (req, res) => {
    try {
        const connectionState = mongoose.connection.readyState;
        const states = {
            0: 'disconnected',
            1: 'connected',
            2: 'connecting',
            3: 'disconnecting'
        };

        res.json({
            status: 'Database connection test',
            state: states[connectionState],
            readyState: connectionState,
            connected: connectionState === 1
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Mock data endpoints for development (when MongoDB is not available)
app.get('/api/mock/resources', (req, res) => {
    const { page = 1, limit = 10, department, subject, semester, sort = 'new', search } = req.query;

    // Mock data
    let mockResources = [
        {
            id: 'mock-1',
            title: 'Sample Algorithm Notes',
            description: 'Comprehensive notes on sorting algorithms and data structures',
            department: 'Computer Science',
            subject: 'Data Structures',
            semester: 3,
            fileUrl: 'http://localhost:5000/uploads/sample.pdf',
            uploadedBy: {
                id: 'user-1',
                name: 'John Doe',
                email: 'john@example.com',
                department: 'Computer Science'
            },
            upvotes: 15,
            downvotes: 2,
            downloads: 45,
            createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() // 2 days ago
        },
        {
            id: 'mock-2',
            title: 'Calculus Problem Sets',
            description: 'Solved calculus problems with step-by-step solutions',
            department: 'Mathematics',
            subject: 'Calculus',
            semester: 2,
            fileUrl: 'http://localhost:5000/uploads/calculus.pdf',
            uploadedBy: {
                id: 'user-2',
                name: 'Jane Smith',
                email: 'jane@example.com',
                department: 'Mathematics'
            },
            upvotes: 8,
            downvotes: 1,
            downloads: 23,
            createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() // 5 days ago
        },
        {
            id: 'mock-3',
            title: 'Physics Lab Reports',
            description: 'Complete physics lab reports with experimental data and analysis',
            department: 'Physics',
            subject: 'Physics Lab',
            semester: 1,
            fileUrl: 'http://localhost:5000/uploads/physics.pdf',
            uploadedBy: {
                id: 'user-3',
                name: 'Mike Johnson',
                email: 'mike@example.com',
                department: 'Physics'
            },
            upvotes: 12,
            downvotes: 0,
            downloads: 67,
            createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() // 1 day ago
        },
        {
            id: 'mock-4',
            title: 'Database Design Notes',
            description: 'Database normalization and ER diagrams with examples',
            department: 'Computer Science',
            subject: 'Database Systems',
            semester: 4,
            fileUrl: 'http://localhost:5000/uploads/database.pdf',
            uploadedBy: {
                id: 'user-4',
                name: 'Sarah Wilson',
                email: 'sarah@example.com',
                department: 'Computer Science'
            },
            upvotes: 20,
            downvotes: 1,
            downloads: 89,
            createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() // 3 days ago
        },
        {
            id: 'mock-5',
            title: 'Chemistry Formulas',
            description: 'Important chemistry formulas and equations for organic chemistry',
            department: 'Chemistry',
            subject: 'Organic Chemistry',
            semester: 3,
            fileUrl: 'http://localhost:5000/uploads/chemistry.pdf',
            uploadedBy: {
                id: 'user-5',
                name: 'Alex Brown',
                email: 'alex@example.com',
                department: 'Chemistry'
            },
            upvotes: 6,
            downvotes: 0,
            downloads: 34,
            createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() // 1 week ago
        }
    ];

    // Apply filters
    let filteredResources = mockResources;

    if (department) {
        filteredResources = filteredResources.filter(r =>
            r.department.toLowerCase().includes(department.toLowerCase())
        );
    }

    if (subject) {
        filteredResources = filteredResources.filter(r =>
            r.subject.toLowerCase().includes(subject.toLowerCase())
        );
    }

    if (semester) {
        filteredResources = filteredResources.filter(r =>
            r.semester === parseInt(semester)
        );
    }

    if (search) {
        filteredResources = filteredResources.filter(r =>
            r.title.toLowerCase().includes(search.toLowerCase()) ||
            r.description.toLowerCase().includes(search.toLowerCase()) ||
            r.department.toLowerCase().includes(search.toLowerCase()) ||
            r.subject.toLowerCase().includes(search.toLowerCase())
        );
    }

    // Apply sorting
    switch (sort) {
        case 'top':
            filteredResources.sort((a, b) => (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes));
            break;
        case 'downloads':
            filteredResources.sort((a, b) => b.downloads - a.downloads);
            break;
        case 'old':
            filteredResources.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
            break;
        case 'new':
        default:
            filteredResources.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            break;
    }

    // Apply pagination
    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const endIndex = startIndex + parseInt(limit);
    const paginatedResources = filteredResources.slice(startIndex, endIndex);

    const totalItems = filteredResources.length;
    const totalPages = Math.ceil(totalItems / parseInt(limit));
    const hasNextPage = parseInt(page) < totalPages;
    const hasPrevPage = parseInt(page) > 1;

    res.json({
        resources: paginatedResources,
        pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalItems,
            itemsPerPage: parseInt(limit),
            hasNextPage,
            hasPrevPage
        }
    });
});

// Mock authentication endpoints for development
app.post('/api/mock/auth/register', (req, res) => {
    const { name, email, password, department } = req.body;

    // Simple validation
    if (!name || !email || !password || !department) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Mock user creation
    const mockUser = {
        id: 'mock-user-' + Date.now(),
        name,
        email,
        department,
        role: 'user',
        createdAt: new Date().toISOString()
    };

    // Mock JWT token (in real app, this would be signed with JWT_SECRET)
    const mockToken = 'mock-jwt-token-' + Date.now();

    res.json({
        message: 'User registered successfully',
        token: mockToken,
        user: mockUser
    });
});

app.post('/api/mock/auth/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    // Mock user (in real app, this would be fetched from database)
    const mockUser = {
        id: 'mock-user-123',
        name: 'Test User',
        email,
        department: 'Computer Science',
        role: 'user',
        createdAt: new Date().toISOString()
    };

    // Mock JWT token
    const mockToken = 'mock-jwt-token-' + Date.now();

    res.json({
        message: 'Login successful',
        token: mockToken,
        user: mockUser
    });
});

// Mock voting endpoints for development
app.post('/api/mock/resources/:id/vote', (req, res) => {
    const { id } = req.params;
    const { type } = req.body;
    
    if (!type || !['up', 'down'].includes(type)) {
        return res.status(400).json({ error: 'Invalid vote type. Must be "up" or "down"' });
    }
    
    // Mock voting logic - in real app, this would update database
    const mockUpvotes = Math.floor(Math.random() * 50) + 10;
    const mockDownvotes = Math.floor(Math.random() * 20) + 1;
    const mockUserHasUpvoted = type === 'up';
    const mockUserHasDownvoted = type === 'down';
    
    res.json({
        message: 'Vote recorded successfully',
        upvotes: mockUpvotes,
        downvotes: mockDownvotes,
        userHasUpvoted: mockUserHasUpvoted,
        userHasDownvoted: mockUserHasDownvoted
    });
});

// Mock download endpoint for development
app.get('/api/mock/resources/:id/download', (req, res) => {
    const { id } = req.params;
    
    // Mock file URL - in real app, this would return actual file URL
    const mockFileUrl = `http://localhost:5000/uploads/mock-${id}.pdf`;
    
    res.json({
        message: 'Download URL generated',
        fileUrl: mockFileUrl,
        downloadCount: Math.floor(Math.random() * 100) + 1
    });
});

// Error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
    const status = err.status || 500;
    const message = err.message || 'Internal Server Error';
    res.status(status).json({ error: message });
});

const PORT = process.env.PORT || 5000;

async function start() {
    try {
        console.log('🔗 Attempting to connect to MongoDB...');
        console.log('📍 Connection URI:', process.env.MONGODB_URI ? 'Set' : 'Not set');
        await connectDB();
        console.log('✅ Connected to MongoDB successfully!');
        app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
    } catch (err) {
        console.error('❌ Failed to start server:', err);
        console.log('\n💡 To fix this error:');
        console.log('1. Install MongoDB: https://www.mongodb.com/try/download/community');
        console.log('2. Start MongoDB service');
        console.log('3. Or use MongoDB Atlas (cloud): Update MONGODB_URI in .env');
        console.log('\nFor now, the server will start without database connection.');

        // Start server anyway for development
        app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT} (without database)`);
            console.log('⚠️  Database features will not work until MongoDB is connected');
        });
    }
}

start();

export default app;

