require('dotenv').config();

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const User = require('./models/User');
const Ticket = require('./models/Tickets');
const Counter = require('./models/Counter');
const Customer = require('./models/Customer');
const Settings = require('./models/Settings');

const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const app = express();
const port = process.env.PORT || 5000;

// Cloudinary config — set these in your Render environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'helpdesk-tickets',
    allowed_formats: ['jpg', 'jpeg', 'png', 'pdf', 'gif', 'webp'],
  },
});
const upload = multer({ storage });

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => res.json({ message: 'Backend running' }));

// ── Assignee (User) Auth ──────────────────────────────────────────────────────
app.post('/api/register', async (req, res) => {
  try {
    const { displayName, email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });
    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ message: 'User already exists' });
    const user = await User.create({ displayName, email, password });
    return res.status(201).json({ message: 'registered', user: { id: user._id, displayName: user.displayName, email: user.email } });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ message: 'Registration failed' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });
    const user = await User.findOne({ email, password });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    return res.status(200).json({ message: 'logged in', user: { id: user._id, displayName: user.displayName, email: user.email } });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Login failed' });
  }
});

// ── List Assignees (Users) ────────────────────────────────────────────────────
app.get(`/api/users`, async (req, res) => {
  try {
    const users = await User.find().select(`-password`).sort({ displayName: 1 });
    return res.status(200).json({ users });
  } catch (error) {
    return res.status(500).json({ message: `Failed to fetch users` });
  }
});

// ── Customer Auth ─────────────────────────────────────────────────────────────
app.post('/api/customers/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: 'Name, email and password are required' });
    const existing = await Customer.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ message: 'Customer already exists' });
    const customer = await Customer.create({ name, email, password });
    return res.status(201).json({
      message: 'registered',
      customer: { id: customer._id, name: customer.name, email: customer.email, status: customer.status, joined: customer.createdAt },
    });
  } catch (error) {
    console.error('Customer register error:', error);
    return res.status(500).json({ message: 'Registration failed' });
  }
});

app.post('/api/customers/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });
    const customer = await Customer.findOne({ email: email.toLowerCase(), password });
    if (!customer) return res.status(401).json({ message: 'Invalid credentials' });
    return res.status(200).json({
      message: 'logged in',
      customer: { id: customer._id, name: customer.name, email: customer.email, status: customer.status, joined: customer.createdAt },
    });
  } catch (error) {
    console.error('Customer login error:', error);
    return res.status(500).json({ message: 'Login failed' });
  }
});

// ── Customers CRUD ────────────────────────────────────────────────────────────
app.get('/api/customers', async (req, res) => {
  try {
    const customers = await Customer.find().select('-password').sort({ createdAt: -1 });
    return res.status(200).json({ customers });
  } catch (error) {
    console.error('Error fetching customers:', error);
    return res.status(500).json({ message: 'Failed to fetch customers' });
  }
});

app.post('/api/customers', async (req, res) => {
  try {
    const { name, email, password, status } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: 'Name, email and password are required' });
    const existing = await Customer.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ message: 'Customer already exists' });
    const customer = await Customer.create({ name, email, password, status: status || 'Active' });
    return res.status(201).json({ customer: { id: customer._id, name: customer.name, email: customer.email, status: customer.status, joined: customer.createdAt } });
  } catch (error) {
    console.error('Customer create error:', error);
    return res.status(500).json({ message: 'Failed to create customer' });
  }
});

app.patch('/api/customers/:id', async (req, res) => {
  try {
    const customer = await Customer.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true }).select('-password');
    if (!customer) return res.status(404).json({ message: 'Customer not found' });
    return res.status(200).json({ customer });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update customer' });
  }
});

// ── Tickets ───────────────────────────────────────────────────────────────────
async function getNextSequenceValue(sequenceName) {
  const counter = await Counter.findOneAndUpdate(
    { name: sequenceName },
    { $inc: { value: 1 } },
    { new: true, upsert: true }
  );
  return counter.value;
}

app.post('/api/tickets', upload.single('attachment'), async (req, res) => {
  try {
    const { subject, category, priority, assignee, description, user, requesterName, requesterId, requesterRole } = req.body;
    const attachmentUrl = req.file ? req.file.path : null;
    if (!subject || !description || !category || !priority) return res.status(400).json({ message: 'Subject, description, category, and priority are required' });
    if (!user && !requesterId) return res.status(401).json({ message: 'User is required' });

    // safely cast user to ObjectId only if it looks like one
    let userRef = null;
    if (user && /^[a-f\d]{24}$/i.test(String(user))) {
      userRef = user;
    }

    const ticket = await Ticket.create({
      id: await getNextSequenceValue('ticketId'),
      subject, category, priority, assignee, description, attachmentUrl,
      user: userRef,
      requesterName: requesterName || null,
      requesterId: requesterId ? String(requesterId) : null,
      requesterRole: requesterRole || 'assignee',
    });

    return res.status(201).json({ message: 'Ticket created', ticket });
  } catch (error) {
    console.error('Ticket creation error:', error);
    return res.status(500).json({ message: 'Failed to create ticket' });
  }
});

app.get('/api/tickets', async (req, res) => {
  try {
    const tickets = await Ticket.find();
    return res.status(200).json({ tickets });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch tickets' });
  }
});

app.get('/api/tickets/:id', async (req, res) => {
  try {
    const ticket = await Ticket.findOne({ id: Number(req.params.id) });
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
    return res.status(200).json({ ticket });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch ticket' });
  }
});

app.patch('/api/tickets/:id', async (req, res) => {
  try {
    const ticket = await Ticket.findOneAndUpdate({ id: Number(req.params.id) }, { $set: req.body }, { new: true });
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
    return res.status(200).json({ ticket });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update ticket' });
  }
});

// ── Ticket Messages ───────────────────────────────────────────────────────────
app.get('/api/tickets/:id/messages', async (req, res) => {
  try {
    const ticket = await Ticket.findOne({ id: Number(req.params.id) });
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
    return res.status(200).json({ messages: ticket.messages || [] });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch messages' });
  }
});

app.post('/api/tickets/:id/messages', async (req, res) => {
  try {
    const { senderName, senderId, type, body } = req.body;
    if (!body || !senderName) return res.status(400).json({ message: 'senderName and body are required' });
    const message = { senderName, senderId, type: type || 'reply', body, createdAt: new Date() };
    const ticket = await Ticket.findOneAndUpdate(
      { id: Number(req.params.id) },
      { $push: { messages: message }, $set: { updatedAt: new Date() } },
      { new: true }
    );
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
    const saved = ticket.messages[ticket.messages.length - 1];
    return res.status(201).json({ message: saved });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to save message' });
  }
});

// ── Settings ──────────────────────────────────────────────────────────────────
app.get('/api/settings', async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({
        helpDeskName: 'Help Desk Support', companyName: 'Acme Inc.',
        timezone: 'India (UTC+05:30)', dateFormat: 'DD/MM/YYYY',
        timeFormat: '12 Hour', language: 'English',
        allowCustomerTickets: true, emailNotifications: true,
        autoCloseTickets: false, autoCloseDays: 7, satisfactionSurvey: true,
      });
    }
    res.status(200).json(settings);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch settings' });
  }
});

app.put('/api/settings', async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create(req.body);
    } else {
      Object.assign(settings, req.body);
      await settings.save();
    }
    res.status(200).json({ message: 'Settings updated successfully', settings });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update settings' });
  }
});

// ── Start ─────────────────────────────────────────────────────────────────────
async function startServer() {
  if (!process.env.MONGO_DB_URL) throw new Error('MONGO_DB_URL is not set');
  await mongoose.connect(process.env.MONGO_DB_URL);
  console.log('Connected to MongoDB');
  app.listen(port, () => console.log(`Server listening on port ${port}`));
}

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});