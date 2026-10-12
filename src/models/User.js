/**
 * User Model
 * Defines authentication, role, contact info, and location for Customers, Workers, and Admins
 */

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide your full name'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters long'],
      maxlength: [60, 'Name cannot exceed 60 characters'],
    },
    email: {
      type: String,
      required: [true, 'Please provide your email address'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address',
      ],
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [6, 'Password must be at least 6 characters long'],
      select: false, // Do not return password by default in queries
    },
    phone: {
      type: String,
      required: [true, 'Please provide your contact phone number'],
      trim: true,
      match: [
        /^((\+92)?(0092)?(92)?(0)?)(3[0-9]{2}-?[0-9]{7}|3[0-9]{9})$/,
        'Please enter a valid Pakistani mobile number (e.g., 03001234567 or +923001234567)',
      ],
    },
    role: {
      type: String,
      enum: {
        values: ['customer', 'worker', 'admin'],
        message: 'Role must be either customer, worker, or admin',
      },
      default: 'customer',
    },
    city: {
      type: String,
      required: [true, 'Please select your city'],
      trim: true,
      index: true,
    },
    area: {
      type: String,
      required: [true, 'Please specify your area/town'],
      trim: true,
    },
    profileImage: {
      type: String,
      default: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true, // Automatically manage createdAt and updatedAt
  }
);

// Virtual relationship to WorkerProfile if role is 'worker'
userSchema.virtual('workerProfile', {
  ref: 'WorkerProfile',
  localField: '_id',
  foreignField: 'userId',
  justOne: true,
});

// Compound index for fast queries by city and role
userSchema.index({ city: 1, role: 1 });

// Pre-save hook: Hash password with bcrypt before saving if modified
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  const bcrypt = require('bcryptjs');
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Instance method: Verify entered password against hashed password
userSchema.methods.matchPassword = async function (enteredPassword) {
  const bcrypt = require('bcryptjs');
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;
