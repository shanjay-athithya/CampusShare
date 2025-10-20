import mongoose from 'mongoose';

// Establish a MongoDB connection using env var MONGO_URI (fallback to MONGODB_URI)
export async function connectDB() {
    const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
    if (!uri) {
        throw new Error('Missing MONGO_URI/MONGODB_URI in environment');
    }

    if (mongoose.connection.readyState === 1) {
        return mongoose.connection;
    }

    // Add robust connection options, including TLS and timeouts.
    // Atlas typically requires TLS; Node drivers negotiate automatically, but on some
    // Windows/OpenSSL stacks an explicit TLS setting or SNI can help.
    const mongooseOpts = {
        // Socket/Server timeouts to fail fast with actionable logs
        serverSelectionTimeoutMS: 10000,
        connectTimeoutMS: 10000,
        socketTimeoutMS: 20000,
        // Family 4 avoids some IPv6 resolution issues on Windows
        family: 4,
    };

    try {
        await mongoose.connect(uri, mongooseOpts);
        return mongoose.connection;
    } catch (err) {
        // Helpful diagnostics for TLS/SSL and DNS issues
        const hints = [];
        if (/TLS|SSL/i.test(String(err))) {
            hints.push('TLS/SSL error: Ensure your connection string ends with \'retryWrites=true&w=majority\' and uses mongodb+srv.');
            hints.push('If corporate antivirus/SSL inspection is enabled, temporarily disable it or add an exception for MongoDB Atlas.');
            hints.push('Try forcing IPv4 (already enabled) and ensure Windows root cert store is up to date. Run Windows Update.');
        }
        if (/ENOTFOUND|getaddrinfo|DNS/i.test(String(err))) {
            hints.push('DNS error: Verify that \'campusshare.ctul6gl.mongodb.net\' resolves on your network.');
            hints.push('Try: nslookup campusshare.ctul6gl.mongodb.net');
        }
        console.error('[MongoDB] Connection error:', err.message);
        if (hints.length) {
            console.error('[MongoDB] Hints:', hints.join(' | '));
        }
        throw err;
    }
}

// Example usage:
// import { connectDB } from './db.js';
// connectDB().then(() => console.log('DB connected')).catch(console.error);

export default connectDB;


