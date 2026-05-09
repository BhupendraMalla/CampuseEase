const mongoose = require('mongoose');

const createDepartment = new mongoose.Schema({
  createFaculty: { type: String, required: true },
  hod: { type: String },
  department: {
    type: String,
    enum: ['academic', 'administration', 'operations', 'finance'],
    default: 'academic'
  },
  roles: {
    type: [String],
    default: []
  },
  description: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const createDepartmentList = mongoose.model('depatmentList', createDepartment);

module.exports = createDepartmentList;