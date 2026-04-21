const express = require('express');
const router = express.Router();
const axios = require('axios');
const Attendance = require('../models/faceModel');
const FaceRegistration = require('../models/faceRegistrationModel');
const EnrollmentSubjects = require('../models/enrollmentModel');
const verifyToken = require('../middleware');
const Register = require('../models/signupModel');
const UserSubjects = require('../models/userSubjectModel');

// Route to register face
router.post('/register-face', verifyToken, async (req, res) => {
  try {
    const { image, rollno } = req.body;

    if (!image || !rollno) {
      return res.status(400).json({ message: 'Missing image or rollno' });
    }

    // Find user by rollno
    const user = await Register.findOne({ rollno });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if face is already registered
    const existingRegistration = await FaceRegistration.findOne({ rollno });
    if (existingRegistration) {
      return res.status(400).json({ message: 'Face already registered for this student. Update your registration instead.' });
    }

    // Send image to Flask server to extract face encoding
    let faceEncoding = null;
    try {
      const flaskRes = await axios.post('http://127.0.0.1:5000/register-face', { 
        image, 
        rollno: rollno.toString()
      });
      
      if (flaskRes.data.success) {
        faceEncoding = flaskRes.data.faceEncoding;
      }
    } catch (flaskErr) {
      console.warn('Flask face encoding extraction failed:', flaskErr.message);
      // Continue without encoding - we can still store the image
    }

    // Save face registration
    const faceReg = new FaceRegistration({
      userId: user._id,
      rollno,
      email: user.email,
      name: user.name,
      faceImage: image,
      faceEncoding,
      isRegistered: true
    });

    await faceReg.save();

    res.status(201).json({ 
      message: 'Face registered successfully',
      rollno,
      name: user.name
    });

  } catch (error) {
    console.error('Error registering face:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

// Route to update face registration
router.put('/update-face-registration/:rollno', verifyToken, async (req, res) => {
  try {
    const { rollno } = req.params;
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({ message: 'Image is required' });
    }

    const faceReg = await FaceRegistration.findOne({ rollno });
    if (!faceReg) {
      return res.status(404).json({ message: 'Face registration not found' });
    }

    // Send image to Flask server to extract face encoding
    let faceEncoding = null;
    try {
      const flaskRes = await axios.post('http://127.0.0.1:5000/register-face', { 
        image, 
        rollno: rollno.toString()
      });
      
      if (flaskRes.data.success) {
        faceEncoding = flaskRes.data.faceEncoding;
      }
    } catch (flaskErr) {
      console.warn('Flask face encoding extraction failed:', flaskErr.message);
    }

    // Update face registration
    faceReg.faceImage = image;
    if (faceEncoding) faceReg.faceEncoding = faceEncoding;
    faceReg.updatedDate = new Date();

    await faceReg.save();

    res.json({ 
      message: 'Face registration updated successfully',
      rollno
    });

  } catch (error) {
    console.error('Error updating face registration:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

// Route to check if face is registered
router.get('/check-face-registration', verifyToken, async (req, res) => {
  try {
    const token = req.headers.authorization.split(' ')[1];
    const decoded = require('jsonwebtoken').verify(token, process.env.SECRET_KEY);
    const rollno = decoded.rollno;

    if (!rollno) {
      return res.status(400).json({ message: 'Roll number not found in token' });
    }

    const faceReg = await FaceRegistration.findOne({ rollno });
    
    if (!faceReg) {
      return res.json({ isRegistered: false, message: 'Face not registered' });
    }

    res.json({ 
      isRegistered: true, 
      rollno: faceReg.rollno,
      name: faceReg.name,
      registeredDate: faceReg.registeredDate
    });

  } catch (error) {
    console.error('Error checking face registration:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

// Route to mark attendance with face verification
router.post('/mark-attendance', async (req, res) => {
  try {
    const { image, subjectName, rollno } = req.body;

    if (!image || !subjectName) {
      return res.status(400).json({ message: 'Missing image or subjectName' });
    }

    // Check if subject exists
    const subjectExists = await EnrollmentSubjects.findOne({
      subjects: { $elemMatch: { name: subjectName } }
    });

    if (!subjectExists) {
      return res.status(404).json({ message: 'Invalid subject name' });
    }

    // Send image to Flask for face recognition and comparison
    let recognizedRollno = rollno;
    
    try {
      const faceRes = await axios.post('http://127.0.0.1:5000/verify-face', { image });

      if (!faceRes.data.success) {
        return res.status(401).json({ message: 'Face not recognized. Please register your face first.' });
      }

      recognizedRollno = Number(faceRes.data.rollno);
      console.log('Face recognized for roll number:', recognizedRollno);
    } catch (flaskErr) {
      console.error('Flask verification failed:', flaskErr.message);
      return res.status(500).json({ message: 'Face verification service unavailable' });
    }

    // Verify that the recognized face matches the provided rollno (if provided)
    if (rollno && recognizedRollno !== Number(rollno)) {
      return res.status(401).json({ 
        message: 'Face mismatch! Recognized face does not match the provided roll number.' 
      });
    }

    // Check if face is registered
    const faceRegistration = await FaceRegistration.findOne({ rollno: recognizedRollno });
    if (!faceRegistration) {
      return res.status(403).json({ 
        message: 'Face not registered in the system. Please register your face first.' 
      });
    }

    // Find user by recognized rollno
    const user = await Register.findOne({ rollno: recognizedRollno });

    if (!user) {
      return res.status(404).json({ message: 'User not found for recognized roll number' });
    }

    // Check duplicate attendance for today & subject
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const alreadyMarked = await Attendance.findOne({
      rollno: recognizedRollno,
      subjectName,
      date: {
        $gte: today,
        $lt: tomorrow
      }
    });

    if (alreadyMarked) {
      return res.status(409).json({ message: 'Attendance already marked for today' });
    }

    // Save attendance record
    const attendanceRecord = new Attendance({
      rollno: recognizedRollno,
      subjectName,
      image,
      email: user.email,
      name: user.name,
      date: new Date().toISOString().split('T')[0]
    });

    await attendanceRecord.save();

    return res.json({ 
      message: 'Attendance marked successfully',
      rollno: recognizedRollno,
      name: user.name,
      subject: subjectName
    });

  } catch (error) {
    console.error('Error marking attendance:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});


// Get all attendances
router.get('/getAllFaceAttendances', async (req, res) => {
  try {
    const attendances = await Attendance.find();
    res.json(attendances);
  } catch (err) {
    console.error('Error in /getAllAttendances:', err);
    res.status(500).json({ message: 'Failed to fetch attendances', error: err.message });
  }
});

// Get attendance by roll number (protected)
router.get('/getFaceAttendances/:rollno', verifyToken, async (req, res) => {
  try {
    const rollno = Number(req.params.rollno);
    const attendances = await Attendance.find({ rollno });
    res.json(attendances);
  } catch (err) {
    console.error('Error fetching attendances:', err);
    res.status(500).json({ message: 'Failed to fetch attendances' });
  }
});

// Get attendance by email
router.get('/getFaceAttendancesByEmail', verifyToken, async (req, res) => {
  try {
    const email = req.params.email;
    const attendances = await Attendance.find({ email });
    res.json(attendances);
  } catch (err) {
    console.error('Error fetching attendances:', err);
    res.status(500).json({ message: 'Failed to fetch attendances' });
  }
});

// Delete attendance by ID
router.delete('/deleteFaceAttendance/:id', async (req, res) => {
  try {
    await Attendance.findByIdAndDelete(req.params.id);
    res.json({ message: 'Attendance deleted' });
  } catch (err) {
    console.error('Error in /deleteAttendance/:id:', err);
    res.status(500).json({ message: 'Failed to delete attendance', error: err.message });
  }
});

// Get valid roll numbers (students only)
router.get('/valid-rollnos', async (req, res) => {
  try {
    const students = await Register.find(
      { role: 'student', rollno: { $ne: null } },
      { rollno: 1, _id: 0 }
    );

    const rollnos = students.map(s => s.rollno);
    res.status(200).json(rollnos);
  } catch (err) {
    console.error('Error fetching rollnos:', err);
    res.status(500).json({ message: 'Failed to fetch roll numbers' });
  }
});

// Get attendance of students enrolled in subjects taught by current faculty
router.get('/getFaceAttendanceForMySubjects', verifyToken, async (req, res) => {
  try {
    const facultyEmail = req.user.email;

    // Get all enrollments where faculty teaches some subjects
    const facultyEnrollments = await EnrollmentSubjects.find({
      "subjects.teacher": facultyEmail
    });

    if (!facultyEnrollments.length) {
      return res.status(404).json({ message: 'No subjects found for this faculty' });
    }

    // Extract all subjects taught by this faculty
    const taughtSubjects = facultyEnrollments
      .flatMap(enrollment => enrollment.subjects)
      .filter(subject => subject.teacher === facultyEmail)
      .map(subject => subject.name);

    if (taughtSubjects.length === 0) {
      return res.status(404).json({ message: 'No subjects found for this faculty' });
    }

    // Find students enrolled in these subjects
    const studentEnrollments = await UserSubjects.find({
      "subjects.name": { $in: taughtSubjects }
    });

    const studentEmails = studentEnrollments.map(e => e.userEmail);

    // Find roll numbers of these students
    const students = await Register.find({
      email: { $in: studentEmails },
      role: 'student'
    }, 'rollno');

    const studentRollnos = students.map(s => s.rollno).filter(Boolean);

    if (studentRollnos.length === 0) {
      return res.status(404).json({ message: 'No students found enrolled in your subjects' });
    }

    // Fetch attendance records for these rollnos and subjects
    const attendanceRecords = await Attendance.find({
      rollno: { $in: studentRollnos },
      subjectName: { $in: taughtSubjects }
    });

    return res.json(attendanceRecords);

  } catch (err) {
    console.error('Error in getFaceAttendanceForMySubjects:', err);
    res.status(500).json({ message: 'Failed to fetch attendance', error: err.message });
  }
});


// Route to register face
router.post('/register-face', async (req, res) => {
  try {
    const { image, rollno } = req.body;

    if (!image || !rollno) {
      return res.status(400).json({ message: 'Missing image or rollno' });
    }

    // Call Flask server to register face
    const flaskRes = await axios.post('http://127.0.0.1:5000/register-face', { image, rollno });

    if (!flaskRes.data.success) {
      return res.status(400).json({ message: 'Flask registration failed', details: flaskRes.data });
    }

    // Save faceId to user document in MongoDB
    const faceId = flaskRes.data.faceId; // this is the rollno as string

    const user = await Register.findOneAndUpdate(
      { rollno: Number(rollno) },
      { faceId: faceId },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found to save faceId' });
    }

    return res.json({ message: 'Face registered and faceId saved', user });

  } catch (error) {
    console.error('Error in register-face:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

module.exports = router;