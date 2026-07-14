// This MUST be the very first import in app.ts
// It loads the .env file before any other module runs
import dotenv from 'dotenv';
dotenv.config();

// Inject production fallback defaults for Vercel if environment variables are empty
if (!process.env.MONGO_URI) {
  process.env.MONGO_URI = 'mongodb+srv://freelanceproject2000:xMKnDQ3jJgFXShEV@cluster0.elfs68i.mongodb.net/optical';
}
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'super_secret_optical_shop_key';
}
if (!process.env.CLIENT_URL) {
  process.env.CLIENT_URL = 'https://sha-optical-frontend.vercel.app';
}
if (!process.env.CLOUDINARY_CLOUD_NAME) {
  process.env.CLOUDINARY_CLOUD_NAME = 'ptmqzhee';
}
if (!process.env.CLOUDINARY_API_KEY) {
  process.env.CLOUDINARY_API_KEY = '723162822132452';
}
if (!process.env.CLOUDINARY_API_SECRET) {
  process.env.CLOUDINARY_API_SECRET = '003rOQjD134VtEUt0mEkj87_hBg';
}
