const mongoose = require('mongoose');

const FaceRegistrationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'register',
    required: true,
    unique: true
  },
  rollno: {
    type: Number,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  faceImage: {
    type: String, // Base64 encoded image or file path
    required: true
  },
  faceEncoding: {
    type: String, // Stores face encoding from Flask
  },
  isRegistered: {
    type: Boolean,
    default: true
  },
  registeredDate: {
    type: Date,
    default: Date.now
  },
  updatedDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('FaceRegistration', FaceRegistrationSchema);
