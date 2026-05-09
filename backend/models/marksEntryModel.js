const mongoose = require('mongoose');

const MarksEntrySchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'register',
    required: true
  },
  studentEmail: {
    type: String,
    required: true
  },
  subjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'userSubject',
    required: true
  },
  subjectName: {
    type: String,
    required: true
  },
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'register',
    required: true
  },
  teacherEmail: {
    type: String,
    required: true
  },
  marks: {
    type: Number,
    min: 0,
    max: 100,
    required: true
  },
  marksType: {
    type: String,
    enum: ['internal', 'assignment', 'quiz', 'midterm', 'final', 'other'],
    default: 'internal'
  },
  totalMarks: {
    type: Number,
    default: 100
  },
  remarks: {
    type: String
  },
  department: {
    type: String,
    default: 'academic'
  },
  semester: {
    type: Number
  },
  academicYear: {
    type: String
  },
  enteredAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const MarksEntry = mongoose.model('marksEntry', MarksEntrySchema);

module.exports = MarksEntry;
