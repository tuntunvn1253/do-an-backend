const express = require('express');
const router = express.Router();
const {
    getAllCoupons,
    getCouponById,
    createCoupon,
    updateCoupon,
    deleteCoupon,
    validateCoupon
} = require('../controllers/coupon.controller');
const { protect, admin } = require('../middleware/auth.middleware');

// Public to logged in users for checkout
router.post('/validate', protect, validateCoupon);

// Admin only routes
router.use(protect, admin);

router.route('/')
    .get(getAllCoupons)
    .post(createCoupon);

router.route('/:id')
    .get(getCouponById)
    .put(updateCoupon)
    .delete(deleteCoupon);

module.exports = router;
