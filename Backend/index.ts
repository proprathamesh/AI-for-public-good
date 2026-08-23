import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth, DecodedIdToken } from 'firebase-admin/auth';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

import onboarding from './routes/Onboarding';
import inventoryRoutes from './routes/InventoryRoutes';
import AIroutes from './routes/AiRoutes';
import schemeRoutes from './routes/SchemeRoutes';
import profile from './routes/ProfileRoutes';
import transaction from './routes/TransactionRoutes';

dotenv.config();

const app = express();
app.use((req, res, next) => {
  // Allow your specific frontend (or '*' for any frontend)
  res.header('Access-Control-Allow-Origin', 'https://ai-for-public-good-frontend.vercel.app');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // If it's a preflight OPTIONS request, immediately send a 200 OK and stop!
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use('/api/users', onboarding);
app.use('/api/inventory', inventoryRoutes);
app.use('/api', AIroutes);
app.use('/api/schemes', schemeRoutes);
app.use('/api/profile', profile);
app.use('/api/transaction', transaction);
// ---------------------------------------------------------
// 1. Firebase Admin Initialization
// ---------------------------------------------------------
// Using require specifically for the JSON file is standard in TS
let serviceAccount;

if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  // Production (Render): Parse the JSON string from the environment variable
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
} else {
  // Local Development: Use the physical file
  serviceAccount = require('./firebaseServiceAccount.json');
}
// serviceAccount = require(path.join(__dirname, './firebaseServiceAccount.json'));

initializeApp({
  credential: cert(serviceAccount)
});

// Extend Express Request to hold the decoded Firebase token
declare global {
  namespace Express {
    interface Request {
      user?: DecodedIdToken;
    }
  }
}

// ---------------------------------------------------------
// 2. MongoDB Connection & Schema
// ---------------------------------------------------------
mongoose.connect(process.env.MONGO_URI as string)
  .then(() => console.log('Connected to MongoDB successfully'))
  .catch((err: any) => console.error('MongoDB connection error:', err));


// ---------------------------------------------------------
// 3. API Routes
// ---------------------------------------------------------

// Health Check Route
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'Backend is running securely' });
});

// ---------------------------------------------------------
// Start Server
// ---------------------------------------------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

export default app;