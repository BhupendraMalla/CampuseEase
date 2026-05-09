require('dotenv').config();
const express = require('express');
const router = express.Router();
const MarksEntry = require('../models/marksEntryModel');
const userRegister = require('../models/signupModel');
const verifyToken = require('../middleware');
const { verifyRole, verifyCanCreateUser, canPerformAction } = require('../middleware/authRoles');

/**
 * Create marks entry (Teachers only)
 * POST /marks/create
 */
router.post('/marks/create', verifyToken, verifyRole(['faculty', 'coordinator', 'director', 'principal']), async (req, res) => {
  try {
    const { studentId, studentEmail, subjectId, subjectName, marks, marksType, totalMarks, remarks, semester, academicYear } = req.body;

    // Validate required fields
    if (!studentId || !studentEmail || !subjectId || !subjectName || marks === undefined) {
      return res.status(400).json({ message: 'All required fields must be provided' });
    }

    // Validate marks
    if (marks < 0 || marks > (totalMarks || 100)) {
      return res.status(400).json({ message: `Marks must be between 0 and ${totalMarks || 100}` });
    }

    // Verify student exists
    const student = await userRegister.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Create marks entry
    const marksEntry = new MarksEntry({
      studentId,
      studentEmail,
      subjectId,
      subjectName,
      teacherId: req.user.userId || req.user.id,
      teacherEmail: req.user.email,
      marks,
      marksType: marksType || 'internal',
      totalMarks: totalMarks || 100,
      remarks,
      department: req.user.department || 'academic',
      semester,
      academicYear
    });

    await marksEntry.save();
    res.status(201).json({ message: 'Marks entry created successfully', marksEntry });
  } catch (error) {
    console.error('Error creating marks entry:', error);
    res.status(500).json({ message: 'Error creating marks entry', error: error.message });
  }
});

/**
 * Update marks entry (Teachers only)
 * PUT /marks/update/:id
 */
router.put('/marks/update/:id', verifyToken, verifyRole(['faculty', 'coordinator', 'director', 'principal']), async (req, res) => {
  try {
    const { id } = req.params;
    const { marks, marksType, remarks, totalMarks } = req.body;

    if (!marks && !marksType && !remarks && !totalMarks) {
      return res.status(400).json({ message: 'At least one field must be updated' });
    }

    // Find the marks entry
    const marksEntry = await MarksEntry.findById(id);
    if (!marksEntry) {
      return res.status(404).json({ message: 'Marks entry not found' });
    }

    // Only teacher who created the entry or admin can update
    if (marksEntry.teacherEmail !== req.user.email && req.user.role !== 'super-admin' && req.user.role !== 'principal' && req.user.role !== 'coordinator' && req.user.role !== 'director') {
      return res.status(403).json({ message: 'You can only update marks you entered' });
    }

    // Update fields
    if (marks !== undefined) {
      const maxMarks = totalMarks || marksEntry.totalMarks || 100;
      if (marks < 0 || marks > maxMarks) {
        return res.status(400).json({ message: `Marks must be between 0 and ${maxMarks}` });
      }
      marksEntry.marks = marks;
    }

    if (marksType) marksEntry.marksType = marksType;
    if (remarks) marksEntry.remarks = remarks;
    if (totalMarks) marksEntry.totalMarks = totalMarks;
    
    marksEntry.updatedAt = new Date();

    await marksEntry.save();
    res.status(200).json({ message: 'Marks entry updated successfully', marksEntry });
  } catch (error) {
    console.error('Error updating marks entry:', error);
    res.status(500).json({ message: 'Error updating marks entry', error: error.message });
  }
});

/**
 * Get marks for specific student (Students, Teachers, Academic staff)
 * GET /marks/student/:studentId
 */
router.get('/marks/student/:studentId', verifyToken, async (req, res) => {
  try {
    const { studentId } = req.params;
    const userRole = req.user.role;
    const userEmail = req.user.email;

    // Check if user can view these marks
    if (userRole === 'student') {
      // Students can only view their own marks
      if (req.user.userId?.toString() !== studentId && req.user.id?.toString() !== studentId) {
        return res.status(403).json({ message: 'You can only view your own marks' });
      }
    } else if (!['faculty', 'coordinator', 'director', 'principal', 'super-admin', 'finance-officer'].includes(userRole)) {
      return res.status(403).json({ message: 'You do not have permission to view marks' });
    }

    const marks = await MarksEntry.find({ studentId }).populate('subjectId');
    res.status(200).json({ marks });
  } catch (error) {
    console.error('Error fetching marks:', error);
    res.status(500).json({ message: 'Error fetching marks', error: error.message });
  }
});

/**
 * Get marks entered by a teacher
 * GET /marks/teacher/:teacherId
 */
router.get('/marks/teacher/:teacherId', verifyToken, verifyRole(['faculty', 'coordinator', 'director', 'principal', 'super-admin']), async (req, res) => {
  try {
    const { teacherId } = req.params;

    // Teachers can view their own marks, admin/coordinator can view all
    if (req.user.role === 'faculty' && req.user.userId?.toString() !== teacherId && req.user.id?.toString() !== teacherId) {
      return res.status(403).json({ message: 'You can only view marks you entered' });
    }

    const marks = await MarksEntry.find({ teacherId }).populate(['studentId', 'subjectId']);
    res.status(200).json({ marks });
  } catch (error) {
    console.error('Error fetching teacher marks:', error);
    res.status(500).json({ message: 'Error fetching marks', error: error.message });
  }
});

/**
 * Get all marks (Admin/Coordinator/Director/Principal only)
 * GET /marks/all
 */
router.get('/marks/all', verifyToken, verifyRole(['coordinator', 'director', 'principal', 'super-admin']), async (req, res) => {
  try {
    const { semester, academicYear, department } = req.query;
    let query = {};

    if (semester) query.semester = semester;
    if (academicYear) query.academicYear = academicYear;
    if (department) query.department = department;
    
    // Coordinators/Directors can only view their department
    if (req.user.role === 'coordinator' || req.user.role === 'director') {
      query.department = req.user.department || 'academic';
    }

    const marks = await MarksEntry.find(query).populate(['studentId', 'subjectId']);
    res.status(200).json({ marks, count: marks.length });
  } catch (error) {
    console.error('Error fetching all marks:', error);
    res.status(500).json({ message: 'Error fetching marks', error: error.message });
  }
});

/**
 * Get marks by subject
 * GET /marks/subject/:subjectId
 */
router.get('/marks/subject/:subjectId', verifyToken, async (req, res) => {
  try {
    const { subjectId } = req.params;

    // Only teachers who teach this subject, and admin/coordinators
    if (!['faculty', 'coordinator', 'director', 'principal', 'super-admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'You do not have permission to view subject marks' });
    }

    const marks = await MarksEntry.find({ subjectId }).populate(['studentId']);
    res.status(200).json({ marks });
  } catch (error) {
    console.error('Error fetching subject marks:', error);
    res.status(500).json({ message: 'Error fetching marks', error: error.message });
  }
});

/**
 * Delete marks entry
 * DELETE /marks/:id
 */
router.delete('/marks/:id', verifyToken, verifyRole(['coordinator', 'director', 'principal', 'super-admin']), async (req, res) => {
  try {
    const { id } = req.params;

    const marksEntry = await MarksEntry.findById(id);
    if (!marksEntry) {
      return res.status(404).json({ message: 'Marks entry not found' });
    }

    // Coordinators/Directors can only delete from their department
    if (req.user.role === 'coordinator' || req.user.role === 'director') {
      if (marksEntry.department !== (req.user.department || 'academic')) {
        return res.status(403).json({ message: 'You can only delete marks from your department' });
      }
    }

    await MarksEntry.findByIdAndDelete(id);
    res.status(200).json({ message: 'Marks entry deleted successfully' });
  } catch (error) {
    console.error('Error deleting marks entry:', error);
    res.status(500).json({ message: 'Error deleting marks entry', error: error.message });
  }
});

module.exports = router;
