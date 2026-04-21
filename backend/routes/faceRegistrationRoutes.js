const express = require('express');
const router = express.Router();
const FaceRegistration = require('../models/faceRegistrationModel');
const Register = require('../models/signupModel');
const verifyToken = require('../middleware');
const axios = require('axios');

// Register face (alternate route if needed)
router.post('/register-face', verifyToken, async (req, res) => {
  try {
    const { image, rollno } = req.body;
    if (!image || !rollno) return res.status(400).json({ message: 'Missing image or rollno' });

    const user = await Register.findOne({ rollno });
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Send to Flask to register
    try {
      await axios.post('http://127.0.0.1:5000/register-face', { image, rollno: rollno.toString() });
    } catch (err) {
      console.warn('Flask register-face failed:', err.message);
    }

    const faceReg = new FaceRegistration({ userId: user._id, rollno, email: user.email, name: user.name, faceImage: image, isRegistered: true });
    await faceReg.save();

    res.json({ message: 'Face registered (route) successfully' });
  } catch (error) {
    console.error('Error in register-face route:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

module.exports = router;
