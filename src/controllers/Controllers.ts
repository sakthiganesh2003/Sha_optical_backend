import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Admin, Customer, Order, MasterData, ICustomer, IOrder, IMasterData } from '../models/Schemas';
import { uploadFile } from '../config/cloudinary';
import { AuthRequest } from '../middleware/auth';
import mongoose from 'mongoose';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_optical_shop_key';

// --- AUTH CONTROLLER ---
export const loginAdmin = async (req: Request, res: Response) => {
  const { username, password } = req.body;

  try {
    const admin = await Admin.findOne({ username });
    if (!admin) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    const token = jwt.sign({ id: admin._id, name: admin.name }, JWT_SECRET, {
      expiresIn: '7d',
    });

    return res.status(200).json({
      token,
      admin: {
        id: admin._id,
        username: admin.username,
        name: admin.name,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    const admin = await Admin.findById(req.adminId).select('-password');
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }
    return res.status(200).json(admin);
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

// --- CUSTOMER CONTROLLER ---
export const addCustomer = async (req: Request, res: Response) => {
  try {
    const { name, mobile, eyePower, frame, lensType, amount, status, notes } = req.body;

    // Validate uniqueness of mobile number
    const existing = await Customer.findOne({ mobile });
    if (existing) {
      return res.status(400).json({ message: 'Customer with this mobile number already exists.' });
    }

    // Handle files upload
    let photoUrl = '';
    let prescriptionUrl = '';
    let invoiceUrl = '';

    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    if (files) {
      if (files['photo'] && files['photo'][0]) {
        photoUrl = await uploadFile(files['photo'][0], req);
      }
      if (files['prescriptionImage'] && files['prescriptionImage'][0]) {
        prescriptionUrl = await uploadFile(files['prescriptionImage'][0], req);
      }
      if (files['invoice'] && files['invoice'][0]) {
        invoiceUrl = await uploadFile(files['invoice'][0], req);
      }
    }

    // Create Customer
    const customer = new Customer({
      name,
      mobile,
      photo: photoUrl || undefined,
    });

    const savedCustomer = await customer.save();

    // Create associated initial Order if there is an amount or prescription details
    // Note: If fields are not provided, we can set defaults.
    const parsedEyePower = typeof eyePower === 'string' ? JSON.parse(eyePower) : eyePower;
    const parsedFrame = typeof frame === 'string' ? JSON.parse(frame) : frame;

    const order = new Order({
      customerId: savedCustomer._id,
      eyePower: parsedEyePower || {
        right: { sph: '', cyl: '', axis: '' },
        left: { sph: '', cyl: '', axis: '' },
      },
      frame: parsedFrame || { brand: '', model: '', color: '' },
      lensType: lensType || '',
      amount: Number(amount) || 0,
      status: status || 'New',
      prescriptionImage: prescriptionUrl || undefined,
      invoice: invoiceUrl || undefined,
      notes: notes || '',
    });

    const savedOrder = await order.save();

    return res.status(201).json({
      customer: savedCustomer,
      order: savedOrder,
    });
  } catch (error: any) {
    console.error('Error adding customer:', error);
    return res.status(500).json({ message: error.message });
  }
};

export const updateCustomer = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, mobile } = req.body;

  try {
    const customer = await Customer.findById(id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    if (mobile && mobile !== customer.mobile) {
      const existing = await Customer.findOne({ mobile });
      if (existing) {
        return res.status(400).json({ message: 'Customer with this mobile number already exists.' });
      }
      customer.mobile = mobile;
    }

    if (name) {
      customer.name = name;
    }

    // Check if new photo was uploaded
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    if (files && files['photo'] && files['photo'][0]) {
      customer.photo = await uploadFile(files['photo'][0], req);
    }

    const updatedCustomer = await customer.save();
    return res.status(200).json(updatedCustomer);
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

export const deleteCustomer = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const customer = await Customer.findById(id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Delete customer orders
    await Order.deleteMany({ customerId: id });
    // Delete customer
    await Customer.findByIdAndDelete(id);

    return res.status(200).json({ message: 'Customer and all orders deleted successfully' });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

export const searchCustomers = async (req: Request, res: Response) => {
  const { query } = req.query;

  try {
    let matchQuery = {};
    if (query) {
      matchQuery = {
        $or: [
          { mobile: { $regex: '^' + query, $options: 'i' } },
          { name: { $regex: query, $options: 'i' } },
        ],
      };
    }

    const customersWithOrderCount = await Customer.aggregate([
      { $match: matchQuery },
      {
        $lookup: {
          from: 'orders',
          localField: '_id',
          foreignField: 'customerId',
          as: 'orders',
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          mobile: 1,
          photo: 1,
          createdAt: 1,
          updatedAt: 1,
          orderCount: { $size: '$orders' },
        },
      },
      { $sort: { createdAt: -1 } },
    ]);

    return res.status(200).json(customersWithOrderCount);
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

export const getCustomerDetails = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const customer = await Customer.findById(id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Get orders sorted by date descending
    const orders = await Order.find({ customerId: id }).sort({ createdAt: -1 });

    return res.status(200).json({
      customer,
      orders,
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

// --- ORDER CONTROLLER ---
export const createOrder = async (req: Request, res: Response) => {
  const { customerId, eyePower, frame, lensType, amount, status, notes } = req.body;

  try {
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    let prescriptionUrl = '';
    let invoiceUrl = '';

    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    if (files) {
      if (files['prescriptionImage'] && files['prescriptionImage'][0]) {
        prescriptionUrl = await uploadFile(files['prescriptionImage'][0], req);
      }
      if (files['invoice'] && files['invoice'][0]) {
        invoiceUrl = await uploadFile(files['invoice'][0], req);
      }
    }

    const parsedEyePower = typeof eyePower === 'string' ? JSON.parse(eyePower) : eyePower;
    const parsedFrame = typeof frame === 'string' ? JSON.parse(frame) : frame;

    const order = new Order({
      customerId,
      eyePower: parsedEyePower,
      frame: parsedFrame,
      lensType,
      amount: Number(amount),
      status: status || 'New',
      prescriptionImage: prescriptionUrl || undefined,
      invoice: invoiceUrl || undefined,
      notes: notes || '',
    });

    const savedOrder = await order.save();
    return res.status(201).json(savedOrder);
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

export const updateOrder = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { eyePower, frame, lensType, amount, status, notes } = req.body;

  try {
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    if (files) {
      if (files['prescriptionImage'] && files['prescriptionImage'][0]) {
        order.prescriptionImage = await uploadFile(files['prescriptionImage'][0], req);
      }
      if (files['invoice'] && files['invoice'][0]) {
        order.invoice = await uploadFile(files['invoice'][0], req);
      }
    }

    if (eyePower) {
      order.eyePower = typeof eyePower === 'string' ? JSON.parse(eyePower) : eyePower;
    }
    if (frame) {
      order.frame = typeof frame === 'string' ? JSON.parse(frame) : frame;
    }
    if (lensType) order.lensType = lensType;
    if (amount !== undefined) order.amount = Number(amount);
    if (status) order.status = status;
    if (notes !== undefined) order.notes = notes;

    const updatedOrder = await order.save();
    return res.status(200).json(updatedOrder);
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

export const deleteOrder = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const order = await Order.findByIdAndDelete(id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    return res.status(200).json({ message: 'Order deleted successfully' });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

export const getOrderById = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const order = await Order.findById(id).populate('customerId');
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    return res.status(200).json(order);
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

// --- MASTER DATA CONTROLLER ---
export const getMasterData = async (req: Request, res: Response) => {
  try {
    const list = await MasterData.find().sort({ value: 1 });
    // Group by type for simpler frontend consumption
    const grouped = list.reduce(
      (acc, item) => {
        acc[item.type].push(item);
        return acc;
      },
      { brands: [], models: [], colors: [], lenses: [] } as Record<string, IMasterData[]>
    );
    return res.status(200).json(grouped);
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

export const addMasterDataItem = async (req: Request, res: Response) => {
  const { type, value } = req.body;

  try {
    const trimmedVal = value.trim();
    const existing = await MasterData.findOne({ type, value: { $regex: `^${trimmedVal}$`, $options: 'i' } });
    if (existing) {
      return res.status(400).json({ message: 'This item already exists.' });
    }

    const item = new MasterData({ type, value: trimmedVal });
    const saved = await item.save();
    return res.status(201).json(saved);
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

export const updateMasterDataItem = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { value } = req.body;

  try {
    const item = await MasterData.findById(id);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    const trimmedVal = value.trim();
    const existing = await MasterData.findOne({
      _id: { $ne: id },
      type: item.type,
      value: { $regex: `^${trimmedVal}$`, $options: 'i' },
    });
    if (existing) {
      return res.status(400).json({ message: 'Another item with this name already exists.' });
    }

    item.value = trimmedVal;
    const saved = await item.save();
    return res.status(200).json(saved);
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

export const deleteMasterDataItem = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const item = await MasterData.findByIdAndDelete(id);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    return res.status(200).json({ message: 'Item deleted successfully' });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

// --- DASHBOARD CONTROLLER ---
export const getDashboardStats = async (req: Request, res: Response) => {
  const { range } = req.query; // '7days' | '30days' | 'all' (default)

  try {
    const totalCustomers = await Customer.countDocuments();

    // New customers in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const newCustomers = await Customer.countDocuments({
      createdAt: { $gte: thirtyDaysAgo },
    });

    // Orders counts
    const pendingOrders = await Order.countDocuments({
      status: { $in: ['New', 'Processing'] },
    });
    const readyOrders = await Order.countDocuments({ status: 'Ready' });
    const deliveredOrders = await Order.countDocuments({ status: 'Delivered' });

    // Compute Total Revenue (sum of all orders except Cancelled ones, within range if specified)
    const matchCriteria: any = { status: { $ne: 'Cancelled' } };
    
    if (range === '7days') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      matchCriteria.createdAt = { $gte: sevenDaysAgo };
    } else if (range === '30days') {
      const filterAgo = new Date();
      filterAgo.setDate(filterAgo.getDate() - 30);
      matchCriteria.createdAt = { $gte: filterAgo };
    }

    const revenueResult = await Order.aggregate([
      { $match: matchCriteria },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const totalRevenue = revenueResult[0]?.total || 0;

    // Recent customers (last 10 so scroll list is active)
    const recentCustomers = await Customer.find().sort({ createdAt: -1 }).limit(10);

    // Recent orders (last 10 so scroll list is active)
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('customerId', 'name mobile photo');

    return res.status(200).json({
      stats: {
        totalCustomers,
        newCustomers,
        pendingOrders,
        readyOrders,
        deliveredOrders,
        totalRevenue,
      },
      recentCustomers,
      recentOrders,
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};
