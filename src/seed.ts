import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { Admin, Customer, Order, MasterData } from './models/Schemas';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/optical_solution';

const seedDatabase = async () => {
  try {
    console.log('Connecting to database for seeding...');
    await mongoose.connect(MONGO_URI);
    console.log('Database connected.');

    // Clear existing collections
    console.log('Clearing existing database collections...');
    await Admin.deleteMany({});
    await Customer.deleteMany({});
    await Order.deleteMany({});
    await MasterData.deleteMany({});

    // 1. Create Default Admin
    console.log('Seeding Admin account...');
    const hashedPassword = await bcrypt.hash('veeramani@123', 10);
    const admin = new Admin({
      username: 'shaoptical@gmail.com',
      password: hashedPassword,
      name: 'Store Owner',
    });
    await admin.save();
    console.log('Admin account created (User: shaoptical@gmail.com / Pass: veeramani@123).');

    // 2. Seed Master Data (Dropdown Values)
    console.log('Seeding Master Data dropdowns...');
    const brands = ['Ray-Ban', 'Titan Eye+', 'Fastrack', 'Vogue', 'Vincent Chase', 'Oakley', 'Police'];
    const models = ['Full Rim', 'Half Rim', 'Rimless', 'Round', 'Square', 'Rectangle', 'Aviator', 'Cat Eye', 'Wayfarer'];
    const colors = ['Black', 'Brown', 'Blue', 'Grey', 'Gold', 'Silver', 'Transparent', 'Red', 'Green'];
    const lenses = ['Single Vision', 'Progressive', 'Bifocal', 'Blue Cut', 'Anti Glare', 'Photochromic', 'Computer Lens', 'Reading Lens'];

    const masterDataItems = [
      ...brands.map((b) => ({ type: 'brands' as const, value: b })),
      ...models.map((m) => ({ type: 'models' as const, value: m })),
      ...colors.map((c) => ({ type: 'colors' as const, value: c })),
      ...lenses.map((l) => ({ type: 'lenses' as const, value: l })),
    ];

    await MasterData.insertMany(masterDataItems);
    console.log(`Seeded ${masterDataItems.length} dropdown values.`);

    // 3. Seed Sample Customers and Orders
    console.log('Seeding mock customers and order histories...');

    // Customer 1: John Doe
    const john = new Customer({
      name: 'John Doe',
      mobile: '9876543210',
      photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    });
    await john.save();

    const johnOrder1 = new Order({
      customerId: john._id,
      eyePower: {
        right: { sph: '-1.50', cyl: '-0.50', axis: '180' },
        left: { sph: '-1.25', cyl: '-0.75', axis: '170' },
      },
      frame: { brand: 'Ray-Ban', model: 'Wayfarer', color: 'Black' },
      lensType: 'Blue Cut',
      amount: 4500,
      status: 'Delivered',
      notes: 'Customer preferred matte black finish.',
      createdAt: new Date('2026-01-05T10:00:00Z'),
    });
    await johnOrder1.save();

    const johnOrder2 = new Order({
      customerId: john._id,
      eyePower: {
        right: { sph: '-1.75', cyl: '-0.50', axis: '180' },
        left: { sph: '-1.50', cyl: '-0.75', axis: '170' },
      },
      frame: { brand: 'Oakley', model: 'Rectangle', color: 'Grey' },
      lensType: 'Anti Glare',
      amount: 5200,
      status: 'Ready',
      notes: 'Slight increase in right eye spherical power. Sports frame.',
      createdAt: new Date('2026-07-10T14:30:00Z'),
    });
    await johnOrder2.save();

    // Customer 2: Sarah Connor
    const sarah = new Customer({
      name: 'Sarah Connor',
      mobile: '9876543211',
      photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    });
    await sarah.save();

    const sarahOrder = new Order({
      customerId: sarah._id,
      eyePower: {
        right: { sph: '+1.00', cyl: '0.00', axis: '0' },
        left: { sph: '+1.00', cyl: '-0.25', axis: '90' },
      },
      frame: { brand: 'Titan Eye+', model: 'Rimless', color: 'Gold' },
      lensType: 'Progressive',
      amount: 6200,
      status: 'Delivered',
      notes: 'Requires thin lenses. Progress of bifocal conversion.',
      createdAt: new Date('2026-04-12T11:00:00Z'),
    });
    await sarahOrder.save();

    // Customer 3: David Miller
    const david = new Customer({
      name: 'David Miller',
      mobile: '9876543212',
      photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
    });
    await david.save();

    const davidOrder = new Order({
      customerId: david._id,
      eyePower: {
        right: { sph: '-0.50', cyl: '-0.25', axis: '45' },
        left: { sph: '-0.50', cyl: '-0.25', axis: '45' },
      },
      frame: { brand: 'Vincent Chase', model: 'Round', color: 'Transparent' },
      lensType: 'Computer Lens',
      amount: 2800,
      status: 'New',
      notes: 'Needs quick delivery for office work.',
      createdAt: new Date('2026-07-12T09:00:00Z'),
    });
    await davidOrder.save();

    console.log('Seeding database completed successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Database disconnected.');
  }
};

seedDatabase();
