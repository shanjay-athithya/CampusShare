# CampusShare Setup Instructions

## Quick Start (Development Mode)

### 1. Start the Backend Server
```bash
cd server
npm run dev
```
The server will start on `http://localhost:5000`

**Note**: If MongoDB is not installed, the server will start with mock data for development.

### 2. Start the Frontend Client
```bash
cd client
npm run dev
```
The client will start on `http://localhost:5173`

## Database Setup (Optional)

### Option A: Local MongoDB
1. Install MongoDB: https://www.mongodb.com/try/download/community
2. Start MongoDB service
3. The server will automatically connect

### Option B: MongoDB Atlas (Cloud)
1. Create account at https://www.mongodb.com/atlas
2. Create a cluster
3. Get connection string
4. Update `server/.env`:
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/campusshare
```

## Current Status

✅ **Backend Server**: Running on port 5000
✅ **Frontend Client**: Running on port 5173  
✅ **Mock Data**: Available for development
⚠️ **Database**: Not connected (using mock data)

## Features Working

- ✅ Home page with resource listing
- ✅ Authentication forms (Login/Register)
- ✅ Navigation with conditional auth
- ✅ Responsive design with Tailwind
- ✅ Form validation with Formik
- ✅ Toast notifications
- ✅ Mock data for development

## Next Steps

1. **Install MongoDB** for full functionality
2. **Test authentication** (register/login)
3. **Upload resources** (requires database)
4. **Deploy to production**

## Troubleshooting

### Server won't start
- Check if port 5000 is available
- Install dependencies: `npm install`

### Client won't start  
- Check if port 5173 is available
- Install dependencies: `npm install`

### Database connection issues
- Use mock data for development
- Install MongoDB for full features
- Check MongoDB service is running
