const express = require('express');
const router = express.Router();
const axios = require('axios');
const Fee = require('../models/feeModel');
const verifyToken = require('../middleware');

const KHALTI_BASE = process.env.KHALTI_BASE_URL || 'https://dev.khalti.com/api/v2';
const KHALTI_SECRET = process.env.KHALTI_SECRET_KEY || '';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:4200';
const khaltiHeaders = { Authorization: `Key ${KHALTI_SECRET}`, 'Content-Type': 'application/json' };

// --- Khalti ePayment (KPG-2) ---------------------------------------------

// 1) Initiate: create a Pending fee, ask Khalti for a payment_url, redirect user there.
router.post('/khalti/initiate', verifyToken, async (req, res) => {
  try {
    const amount = Number(req.body.amount);
    if (!amount || amount <= 0) return res.status(400).json({ message: 'Invalid amount' });

    const fee = new Fee({
      studentId: req.user.userId,
      amount,
      method: 'Online',
      status: 'Pending',
      receiptNumber: 'RCPT-' + Date.now()
    });
    await fee.save();

    const resp = await axios.post(`${KHALTI_BASE}/epayment/initiate/`, {
      return_url: `${FRONTEND_URL}/dashboard`,
      website_url: FRONTEND_URL,
      amount: Math.round(amount * 100), // paisa
      purchase_order_id: fee._id.toString(),
      purchase_order_name: 'College Fee Payment',
      customer_info: { name: req.user.name || 'Student', email: req.user.email, phone: '9800000000' }
    }, { headers: khaltiHeaders });

    fee.pidx = resp.data.pidx;
    await fee.save();

    res.json({ payment_url: resp.data.payment_url, pidx: resp.data.pidx, feeId: fee._id });
  } catch (err) {
    console.error('Khalti initiate error:', err.response?.data || err.message);
    res.status(502).json({ message: 'Khalti initiate failed', error: err.response?.data || err.message });
  }
});

// 2) Verify (lookup): after the return-url callback, confirm the transaction and mark the fee.
router.post('/khalti/verify', verifyToken, async (req, res) => {
  try {
    const { pidx } = req.body;
    if (!pidx) return res.status(400).json({ message: 'pidx is required' });

    const resp = await axios.post(`${KHALTI_BASE}/epayment/lookup/`, { pidx }, { headers: khaltiHeaders });
    const { status, transaction_id } = resp.data;

    const fee = await Fee.findOne({ pidx });
    if (fee) {
      fee.status = status === 'Completed' ? 'Paid' : (status === 'Pending' ? 'Pending' : 'Unpaid');
      if (transaction_id) fee.transactionId = transaction_id;
      await fee.save();
    }
    res.json({ status, transaction_id, fee });
  } catch (err) {
    console.error('Khalti verify error:', err.response?.data || err.message);
    res.status(502).json({ message: 'Khalti verify failed', error: err.response?.data || err.message });
  }
});

// Student pays fee
router.post('/payFee', verifyToken, async (req, res) => {
  try {
    const { amount, method } = req.body;

    const studentId = req.user.userId;

    // Always start with 'Unpaid' status regardless of method
    const status = 'Unpaid';

    const fee = new Fee({
      studentId,
      amount,
      method,
      receiptNumber: 'RCPT-' + Date.now(),
      status
    });

    await fee.save();
    res.status(201).json({ message: 'Fee submitted successfully', fee });
  } catch (err) {
    console.error('Error in /payFee:', err);
    res.status(500).json({ message: 'Fee payment failed', error: err.message });
  }
});

// Admin approves payment (any method)
router.patch('/approveFee/:id', verifyToken, async (req, res) => {
  try {
    const fee = await Fee.findById(req.params.id);
    if (!fee) return res.status(400).json({ message: 'Invalid fee' });

    fee.status = 'Paid';
    await fee.save();
    res.json({ message: 'Fee approved', fee });
  } catch (err) {
    res.status(500).json({ message: 'Approval failed', error: err.message });
  }
});

// Admin rejects payment (any method)
router.patch('/rejectFee/:id', verifyToken, async (req, res) => {
  try {
    const fee = await Fee.findById(req.params.id);
    if (!fee) return res.status(400).json({ message: 'Invalid fee' });

    fee.status = 'Rejected';  // or 'Rejected' if you want
    await fee.save();
    res.json({ message: 'Fee rejected', fee });
  } catch (err) {
    res.status(500).json({ message: 'Rejection failed', error: err.message });
  }
});

// Get all fees (admin)
router.get('/getAllFees', verifyToken, async (req, res) => {
  try {
    const fees = await Fee.find()
      .populate('studentId', 'name email rollno')
      .sort({ createdAt: -1 });

    res.json(fees);
  } catch (err) {
    console.error('Error in /getAllFees:', err);
    res.status(500).json({ message: 'Failed to fetch fees', error: err.message });
  }
});

// Get fees by student
router.get('/getFees/:studentId', verifyToken, async (req, res) => {
  try {
    const fees = await Fee.find({ studentId: req.params.studentId })
      .populate('studentId', 'name email rollno')
      .sort({ createdAt: -1 });

    res.json(fees);
  } catch (err) {
    console.error('Error in /getFees/:studentId:', err);
    res.status(500).json({ message: 'Failed to fetch fees', error: err.message });
  }
});

// Delete a fee record
router.delete('/deleteFee/:id', verifyToken, async (req, res) => {
  try {
    const deletedFee = await Fee.findByIdAndDelete(req.params.id);
    if (!deletedFee) {
      return res.status(404).json({ message: 'Fee record not found' });
    }
    res.json({ message: 'Fee record deleted successfully', fee: deletedFee });
  } catch (error) {
    console.error('Error in /deleteFee/:id:', error);
    res.status(500).json({ message: 'Error deleting fee record', error });
  }
});

module.exports = router;