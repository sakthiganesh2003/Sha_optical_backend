import mongoose, { Schema, Document } from 'mongoose';

// Admin interface & Schema
export interface IAdmin extends Document {
  username: string;
  password: string;
  name: string;
}

const AdminSchema: Schema = new Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
}, { timestamps: true });

// Customer interface & Schema
export interface ICustomer extends Document {
  name: string;
  mobile: string;
  photo?: string;
  createdAt: Date;
}

const CustomerSchema: Schema = new Schema({
  name: { type: String, required: true },
  mobile: { type: String, required: true, unique: true, index: true },
  photo: { type: String },
}, { timestamps: true });

// Order interface & Schema
export interface IEyePower {
  sph: string;
  cyl: string;
  axis: string;
}

export interface IOrder extends Document {
  customerId: mongoose.Types.ObjectId;
  eyePower: {
    right: IEyePower;
    left: IEyePower;
  };
  frame: {
    brand: string;
    model: string;
    color: string;
  };
  lensType: string;
  amount: number;
  status: 'New' | 'Processing' | 'Ready' | 'Delivered' | 'Cancelled';
  prescriptionImage?: string;
  invoice?: string;
  notes?: string;
  createdAt: Date;
}

const EyePowerSchema = new Schema({
  sph: { type: String, default: '' },
  cyl: { type: String, default: '' },
  axis: { type: String, default: '' },
}, { _id: false });

const OrderSchema: Schema = new Schema({
  customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
  eyePower: {
    right: { type: EyePowerSchema, required: true },
    left: { type: EyePowerSchema, required: true },
  },
  frame: {
    brand: { type: String, required: true },
    model: { type: String, required: true },
    color: { type: String, required: true },
  },
  lensType: { type: String, required: true },
  amount: { type: Number, required: true },
  status: {
    type: String,
    enum: ['New', 'Processing', 'Ready', 'Delivered', 'Cancelled'],
    default: 'New',
    required: true,
  },
  prescriptionImage: { type: String },
  invoice: { type: String },
  notes: { type: String, default: '' },
}, { timestamps: true });

// MasterData interface & Schema (Dropdown items)
export interface IMasterData extends Document {
  type: 'brands' | 'models' | 'colors' | 'lenses';
  value: string;
}

const MasterDataSchema: Schema = new Schema({
  type: {
    type: String,
    enum: ['brands', 'models', 'colors', 'lenses'],
    required: true,
  },
  value: { type: String, required: true },
}, { timestamps: true });

// Ensure combination of type and value is unique
MasterDataSchema.index({ type: 1, value: 1 }, { unique: true });

export const Admin = mongoose.model<IAdmin>('Admin', AdminSchema);
export const Customer = mongoose.model<ICustomer>('Customer', CustomerSchema);
export const Order = mongoose.model<IOrder>('Order', OrderSchema);
export const MasterData = mongoose.model<IMasterData>('MasterData', MasterDataSchema);
