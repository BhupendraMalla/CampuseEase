require('dotenv').config();
const express = require('express');
const router = express.Router();
const multer = require('multer');
const userRegister = require('../models/signupModel');
const jwt = require('jsonwebtoken');
const verifyToken=require('../middleware');
const bcrypt=require('bcrypt');
const Assignment = require('../models/answerAssignmentModel');
const Course = require('../models/enrollmentModel');
const Attendance = require('../models/otpModel');
const Club = require('../models/addClubModel');
const FaceAttendance = require('../models/faceModel');
const { verifyRole, canPerformAction } = require('../middleware/authRoles');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ storage: storage });

// create a new user
router.post('/signup', async (req, res) => {
  try {
    const { name, email, rollno, address, password, confirmPassword, role = 'student' } = req.body;

    // Validate required fields
    if (!name || !email || !address || !password || !confirmPassword) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check password match
    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    // Check if email already exists
    const existingEmail = await userRegister.findOne({ email });
    if (existingEmail) {
      return res.status(409).json({ message: 'Email already registered. Please use a different email or login.' });
    }

    // Check if rollno already exists (if provided)
    if (rollno) {
      const existingRollno = await userRegister.findOne({ rollno });
      if (existingRollno) {
        return res.status(409).json({ message: 'Roll number already registered. Please contact admin.' });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new userRegister({
      name,
      email,
      rollno: rollno || null,
      address,
      password: hashedPassword,
      confirmPassword: hashedPassword,
      role: role || 'student',
      isVerified: false,
      isPasswordSet: true
    });

    await newUser.save();
    res.status(201).json({ message: 'Signup successful! Please wait for admin verification before logging in.' });
  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({ message: 'Something went wrong', error: error.message });
  }
});

// get faculty users
router.get('/user/faculty', async (req, res) => {
    try {
      const faculty = await userRegister.find({ role: 'faculty' });
      const count = await userRegister.countDocuments({ role: 'faculty' });
      res.json({ faculty, count });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  
// get student users
router.get('/user/student', async (req, res) => {
    try {
      const student = await userRegister.find({ role: 'student' });
      const count = await userRegister.countDocuments({ role: 'student' });
      res.json({ student, count });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

// get secretary users
router.get('/user/secretary', async (req, res) => {
    try {
      const secretary = await userRegister.find({ role: 'secretary' });
      const count = await userRegister.countDocuments({ role: 'secretary' });
      res.json({ secretary, count });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  
// login user
router.post('/signin', async (req, res) => {
    try {
        const { email, password } = req.body;
        const userData = await userRegister.findOne({ email });
        if (!userData) {
            console.log("User not found");
            return res.json({ message: 'username is not found ' });
        }
        if(userData.isVerified !=true){
          return res.json({ message: 'User is not verified. Please verify before login! ',userData });
        }
        if (!userData.isPasswordSet) {
        return res.status(403).json({ message: 'Please set your password before logging in.' });
        }
        const userPasswordMatch = await bcrypt.compare(password, userData.password);
        //const userPasswordMatch = password === userData.password;
        if (!userPasswordMatch) {
            // console.log('password doesnot match ');
            return res.json({ message: 'password is incorrect' });
        }
        const userRole = userData.role;
        const token = jwt.sign({ 
          email: userData.email, 
          userId: userData._id , 
          name: userData.name , 
          rollno: userData.rollno , 
          role: userData.role,
          department: userData.department 
        }, process.env.SECRET_KEY);

        res.json({ message: 'Login Sucessfull', role: userRole, token: token, department: userData.department });
    }
    catch (error) {
      res.status(500).json({ message: 'something went wrong', error: error.stack });
    }
})

// get all user data
router.get('/userdata', async (req, res) => {
    const userData = await userRegister.find();
    res.json({ userData: userData });
})
 
// get user data ( for user profile )
router.get('/getuserdata', verifyToken, async (req, res) =>{
    try{
            const { email } = req.user;
            const userdata= await userRegister.findOne({email});
            if(userdata){
                return res.json({ data: userdata });
            }
            else{
                res.status(404).json({message: "data not found"});
            }
    }catch(error)
    {
        res.status(500).json({ message: 'Something went wrong', error: error.message });
    }
})

// update user data ( for user profile )
router.put('/userdata/:id', verifyToken, upload.single("photo"), async (req, res) => {
  try {
    const { address } = req.body;
    const file = req.file;

    const updateData = {};

    if (address && address !== "") {
      updateData.address = address;
    }

    if (file) {
      updateData.photo = `${req.protocol}://${req.get('host')}/uploads/${file.filename}`;
    }

    const updatedUser = await userRegister.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true }
    );

    res.json({ message: 'Profile updated successfully!', userdata: updatedUser });
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong', error });
  }
});

// update user data
router.put('/updateUser/:id', verifyToken, async (req, res) => {
  try {
    const { name, email, address, role, department } = req.body;
    const userToUpdate = await userRegister.findById(req.params.id);

    if (!userToUpdate) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check authorization - users can only update their own data unless they're admin
    if (req.user.userId?.toString() !== req.params.id && req.user.id?.toString() !== req.params.id) {
      if (!['super-admin', 'admin', 'principal', 'coordinator', 'director'].includes(req.user.role)) {
        return res.status(403).json({ message: 'You can only update your own user data' });
      }

      // If changing role, check if current user can create that role
      if (role && role !== userToUpdate.role) {
        if (!canPerformAction(req.user.role, 'canCreateUsers', role)) {
          return res.status(403).json({ message: `You cannot assign role ${role}` });
        }
      }
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (address) updateData.address = address;
    if (role) updateData.role = role;
    if (department) updateData.department = department;

    const updatedUser = await userRegister.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    res.json({ message: 'User updated successfully', user: updatedUser });
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong', error: error.message });
  }
});

// change password (authenticated user changes own password)
router.put('/password/:id', verifyToken, async (req, res) => {
  try {
    const { oldpassword, password, confirmPassword } = req.body;

    if (!oldpassword || !password || !confirmPassword) {
      return res.status(400).json({ error: 'All password fields are required' });
    }

    if (req.user.userId?.toString() !== req.params.id) {
      return res.status(403).json({ error: 'You can only change your own password' });
    }

    const user = await userRegister.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isMatch = await bcrypt.compare(oldpassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Old password is incorrect' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'New password did not match' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await userRegister.findByIdAndUpdate(
      req.params.id,
      { password: hashedPassword, confirmPassword: hashedPassword, isPasswordSet: true },
      { new: true }
    );

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong', error: error.message });
  }
});

// delete user
// This route allows an admin to delete a user by their ID
router.delete('/user/:id', verifyToken, verifyRole(['super-admin', 'admin', 'principal', 'coordinator', 'director']), async (req, res) => {
  try {
      const userToDelete = await userRegister.findById(req.params.id);
      if (!userToDelete) {
          return res.status(404).json({ message: 'User not found' });
      }

      // Check if the current user can delete this user's role
      if (!canPerformAction(req.user.role, 'canDeleteUsers', userToDelete.role)) {
        return res.status(403).json({ message: `Your role (${req.user.role}) cannot delete users with role ${userToDelete.role}` });
      }

      // Coordinator/Director can only delete users in their department
      if (req.user.role === 'coordinator' || req.user.role === 'director') {
        if (userToDelete.department !== (req.user.department || 'academic')) {
          return res.status(403).json({ message: 'You can only delete users from your department' });
        }
      }

      const user = await userRegister.findByIdAndDelete(req.params.id);
      res.json({ message: 'User deleted successfully', user });
  } catch (err) {
      res.status(500).json({ message: err.message });
  }
});


// Filter students by email or roll number or name
// Search one student
router.get('/student/search', async (req, res) => {
  try {
    const { name, rollno, email } = req.query;

    const orConditions = [];

    if (name) orConditions.push({ name: { $regex: name, $options: 'i' } });
    if (email) orConditions.push({ email: { $regex: email, $options: 'i' } });
    if (rollno && !isNaN(Number(rollno))) {
      orConditions.push({ rollno: Number(rollno) });
    }

    if (orConditions.length === 0) {
      return res.status(400).json({ message: 'At least one of name, email or roll number must be provided and valid' });
    }

    const student = await userRegister.findOne({ $or: orConditions }).lean();
    if (!student) {
      return res.status(404).json({ message: 'No student found' });
    }

    // Fetch related data including face attendance
    const [assignments, allCourses, attendanceRecords, faceAttendanceRecords] = await Promise.all([
      Assignment.find({ rollno: student.rollno }).lean(),
      Course.find({ department: student.department || /.*/ }).lean(),
      Attendance.find({
        $or: [
          { name: student.name },
          { email: student.email }
        ]
      }).lean(),
      FaceAttendance.find({ rollno: student.rollno }).lean() // fetch face attendance records for the student
    ]);

    res.status(200).json({
      ...student,
      assignments,
      courses: allCourses,
      attendance: attendanceRecords,
      faceAttendance: faceAttendanceRecords // add face attendance here
    });
  } catch (error) {
    console.error('Error fetching student:', error);
    res.status(500).json({ message: 'Error fetching student', error: error.message });
  }
});

// Search one faculty
router.get('/faculty/search',  async (req, res) => {
  try {
    const { name, email } = req.query;
    const orConditions = [];

    if (name) orConditions.push({ name: { $regex: name, $options: 'i' } });
    if (email) orConditions.push({ email: { $regex: email, $options: 'i' } });

    if (orConditions.length === 0) {
      return res.status(400).json({ message: 'At least name or email must be provided and valid' });
    }

    const faculty = await userRegister.findOne({ role: 'faculty', $or: orConditions }).lean();
    if (!faculty) {
      return res.status(404).json({ message: 'No faculty found' });
    }

    res.status(200).json({
      name: faculty.name,
      email: faculty.email,
      address: faculty.address,
      registereddate: faculty.registereddate,
      photo: faculty.photo || null
    });
  } catch (error) {
    console.error('Error fetching faculty:', error);
    res.status(500).json({ message: 'Error fetching faculty', error: error.message });
  }
});

// Search one secretary
router.get('/secretary/search',  async (req, res) => {
  try {
    const { name, email } = req.query;

    const orConditions = [];
    if (name) orConditions.push({ name: { $regex: name, $options: 'i' } });
    if (email) orConditions.push({ email: { $regex: email, $options: 'i' } });

    if (orConditions.length === 0) {
      return res.status(400).json({ message: 'At least name or email must be provided and valid' });
    }

    const secretary = await userRegister.findOne({ role: 'secretary', $or: orConditions }).lean();
    if (!secretary) {
      return res.status(404).json({ message: 'No secretary found' });
    }

    const club = await Club.findOne({ contactEmail: secretary.email }).lean();

    res.status(200).json({
      name: secretary.name,
      email: secretary.email,
      address: secretary.address,
      registereddate: secretary.registereddate,
      photo: secretary.photo || null,
      club: club || null
    });
  } catch (error) {
    console.error('Error fetching secretary:', error);
    res.status(500).json({ message: 'Error fetching secretary', error: error.message });
  }
});

// Get all users regardless of role
router.get('/users', async (req, res) => {
  try {
    const users = await userRegister.find({});
    res.json({ users, count: users.length });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get users', error: error.message });
  }
});

// verify user account by admin
router.put('/verifyUser/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userFromToken = req.user;

    // Check if the admin is verifying (only admins should be able to verify)
    // You can add role check here if needed

    const updatedUser = await userRegister.findByIdAndUpdate(
      id,
      { isVerified: true },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User verified successfully', user: updatedUser });
  } catch (error) {
    res.status(500).json({ message: 'Failed to verify user', error: error.message });
  }
});

module.exports = router;