CampusShare (MERN Scaffold)
===========================

Minimal, runnable MERN scaffold with Express/Mongo server and Vite React client.

Project Structure
-----------------
- `server/`: Express API (MongoDB via Mongoose)
- `client/`: Vite React app (Tailwind, axios, react-router-dom, formik)

Prerequisites
-------------
- Node.js LTS and npm
- MongoDB running locally (or update `server/.env`)

One-time Setup (PowerShell)
---------------------------
```powershell
# From your workspace directory
New-Item -ItemType Directory -Name campusshare
Set-Location campusshare

# Server
New-Item -ItemType Directory -Name server
Set-Location server
npm init -y
npm pkg set name="campusshare-server"
npm pkg set type="module"
npm pkg set scripts.start="node server.js"
npm pkg set scripts.dev="nodemon server.js"
npm i express mongoose dotenv bcryptjs jsonwebtoken multer cors
npm i -D nodemon
Set-Content -NoNewline -Path .env -Value "MONGODB_URI=mongodb://localhost:27017/campusshare`nPORT=5000`nJWT_SECRET=devsecret`n"

# Create server.js (or copy from server/server.js in this repo)
@"
import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use((err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  res.status(status).json({ error: message });
});

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/campusshare';

async function start() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();

export default app;
"@ | Set-Content server.js

# Back to root
Set-Location ..

# Client
Set-Location client
npm create vite@latest . -- --template react
npm i
npm i axios react-router-dom formik
npm i -D tailwindcss postcss autoprefixer
# If `npx tailwindcss init -p` fails, create the files manually as below
"""/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx}',
  ],
  theme: { extend: {} },
  plugins: [],
};
""" | Set-Content tailwind.config.js
"""export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
""" | Set-Content postcss.config.js
"""@tailwind base;
@tailwind components;
@tailwind utilities;
""" | Set-Content .\src\index.css

# Ready to run
Set-Location ..
```

Run (two terminals)
-------------------
- Server
```powershell
Set-Location server
npm run dev
```

- Client
```powershell
Set-Location client
npm run dev
```

- Client dev server will print a URL like `http://localhost:5173/`
- Server health check at `http://localhost:5000/api/health`

Notes
-----
- Update `server/.env` for non-local MongoDB.
- This scaffold keeps code minimal and ready to extend.


