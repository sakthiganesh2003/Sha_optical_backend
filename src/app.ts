import './config/env'; // ← MUST be first: loads .env before any other module
import express from 'express';
import cors from 'cors';
import path from 'path';
import { connectDB } from './config/db';
import routes from './routes/Routes';


const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS
const allowedOrigins = [
  process.env.CLIENT_URL,
  'https://sha-optical-frontend.vercel.app',
  'http://localhost:3000'
].filter(Boolean) as string[];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);
      
      const isAllowed = allowedOrigins.some(allowed => {
        if (allowed.includes('*')) return true;
        return allowed.replace(/\/$/, '') === origin.replace(/\/$/, '');
      });

      if (isAllowed) {
        callback(null, true);
      } else {
        // Fallback: allow dynamically matching vercel.app previews/branches if needed
        if (origin.endsWith('.vercel.app')) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      }
    },
    credentials: true,
  })
);

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static uploaded files (local fallback storage)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Ensure DB is connected before every request (critical for Vercel serverless)
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    res.status(500).json({ message: 'Database connection failed. Please try again.' });
  }
});

// API Routes
app.use('/api', routes);

// Home route
app.get('/', (req, res) => {
  res.status(200).json({ message: 'Sha Optical Backend API is running successfully' });
});

// Error Handling Middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ message: err.message || 'Internal Server Error' });
});

// Initialize DB connection immediately
connectDB();

// Only listen on port if running locally (not in serverless Vercel environment)
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Express server running on port ${PORT}`);
  });
}

export default app;
