const mongoose = require('mongoose');

const RegisterSchema = new mongoose.Schema({
  name: { type: String },
  photo: { type: String },
  email: { type: String, unique: true, required: true },
  rollno: { type: Number, unique: true, sparse: true },
  address: { type: String },
  password: { type: String },
  confirmPassword: { type: String },
  role: {
    type: String,
    enum: [
      'student', 
      'faculty', 
      'secretary', 
      'admin',
      'super-admin',
      'principal',
      'coordinator',
      'hod',
      'director',
      'it-officer',
      'graphic-designer',
      'receptionist',
      'operations-officer',
      'finance-officer'
    ],
    default: 'student'
  },
  department: {
    type: String,
    enum: [
      'academic',
      'administration',
      'operations',
      'finance',
      'general'
    ],
    default: 'general'
  },
  isPasswordSet: {
    type: Boolean,
    default: false
  },
  registereddate: { type: String },
  isVerified: { type: Boolean, required: true }
});

const Register = mongoose.model('register', RegisterSchema);

module.exports = Register;