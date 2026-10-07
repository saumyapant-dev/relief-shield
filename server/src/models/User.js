/**
 * User Model
 * 
 * WHY MONGOOSE & MONGODB:
 * MongoDB provides flexible document storage ideal for polymorphic user roles 
 * (victims, volunteers, NGOs, donors, admins) where some fields like 'skills' and 'serviceRadius'
 * only apply to specific roles without needing rigid relational join tables.
 * 
 * WHY BCRYPT & JWT:
 * Passwords must never be stored in plain text. bcrypt hashes passwords with a strong salt.
 * JWT (JSON Web Tokens) are stateless, enabling secure role verification on every API request.
 */

const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address',
      ],
    },
    passwordHash: {
      type: String,
      required: [true, 'Please provide a password hash'],
    },
    role: {
      type: String,
      required: [true, 'Please specify a role'],
      enum: ['victim', 'volunteer', 'ngo', 'donor', 'admin'],
      default: 'victim',
    },
    // Applicable to Volunteers only
    skills: {
      type: [String],
      default: [],
    },
    // Applicable to Volunteers only (radius in kilometers)
    serviceRadius: {
      type: Number,
      default: 10,
    },
    // Verification state (e.g., 'pending', 'verified', 'rejected')
    verificationStatus: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'verified',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('User', UserSchema);
