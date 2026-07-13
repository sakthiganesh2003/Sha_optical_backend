import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { upload } from '../config/cloudinary';
import {
  loginAdmin,
  getMe,
  addCustomer,
  updateCustomer,
  deleteCustomer,
  searchCustomers,
  getCustomerDetails,
  createOrder,
  updateOrder,
  deleteOrder,
  getOrderById,
  getMasterData,
  addMasterDataItem,
  updateMasterDataItem,
  deleteMasterDataItem,
  getDashboardStats,
} from '../controllers/Controllers';

const router = Router();

// Multi-field upload middleware
const uploadFields = upload.fields([
  { name: 'photo', maxCount: 1 },
  { name: 'prescriptionImage', maxCount: 1 },
  { name: 'invoice', maxCount: 1 },
]);

// Auth Routes
router.post('/auth/login', loginAdmin);
router.get('/auth/me', requireAuth, getMe);

// Dashboard Routes
router.get('/dashboard/stats', requireAuth, getDashboardStats);

// Customer Routes
router.get('/customers/search', requireAuth, searchCustomers);
router.get('/customers/:id', requireAuth, getCustomerDetails);
router.post('/customers', requireAuth, uploadFields, addCustomer);
router.put('/customers/:id', requireAuth, uploadFields, updateCustomer);
router.delete('/customers/:id', requireAuth, deleteCustomer);

// Order Routes
router.get('/orders/:id', requireAuth, getOrderById);
router.post('/orders', requireAuth, uploadFields, createOrder);
router.put('/orders/:id', requireAuth, uploadFields, updateOrder);
router.delete('/orders/:id', requireAuth, deleteOrder);

// Master Data Routes
router.get('/master-data', requireAuth, getMasterData);
router.post('/master-data', requireAuth, addMasterDataItem);
router.put('/master-data/:id', requireAuth, updateMasterDataItem);
router.delete('/master-data/:id', requireAuth, deleteMasterDataItem);

export default router;
