const mongoose = require('mongoose');

const userSubjectsSchema = new mongoose.Schema({
  userEmail: { type: String, required: true, unique: true },
  enrollment_key: { type: String },
  semester: { type: String },
  department: { type: String },
  subjects: [{ 
    name: String, 
    credit: String, 
    code: String,
    teacher: String
  }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('UserSubjects', userSubjectsSchema);