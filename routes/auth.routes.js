const express = require('express');
const router = express.Router();
const { 
    registerUser, 
    loginUser, 
    verifyEmail, 
    forgotPassword, 
    resetPasswordWithOTP 
} = require('../controllers/auth.controller');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/verifyemail/:token', verifyEmail);
router.post('/forgotpassword', forgotPassword);
router.post('/reset-password-otp', resetPasswordWithOTP);

module.exports = router;
