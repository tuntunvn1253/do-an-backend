const { Coupon } = require('../models');

const getAllCoupons = async (req, res) => {
    try {
        const coupons = await Coupon.findAll({ order: [['created_at', 'DESC']] });
        res.status(200).json({ success: true, count: coupons.length, data: coupons });
    } catch (error) {
        console.error('Error getting coupons:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

const getCouponById = async (req, res) => {
    try {
        const coupon = await Coupon.findByPk(req.params.id);
        if (!coupon) {
            return res.status(404).json({ success: false, message: 'Coupon not found' });
        }
        res.status(200).json({ success: true, data: coupon });
    } catch (error) {
        console.error('Error getting coupon by ID:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

const createCoupon = async (req, res) => {
    try {
        const coupon = await Coupon.create(req.body);
        res.status(201).json({ success: true, data: coupon });
    } catch (error) {
        console.error('Error creating coupon:', error);
        res.status(400).json({ success: false, message: 'Could not create coupon', error: error.message });
    }
};

const updateCoupon = async (req, res) => {
    try {
        const coupon = await Coupon.findByPk(req.params.id);
        if (!coupon) {
            return res.status(404).json({ success: false, message: 'Coupon not found' });
        }
        const updatedCoupon = await coupon.update(req.body);
        res.status(200).json({ success: true, data: updatedCoupon });
    } catch (error) {
        console.error('Error updating coupon:', error);
        res.status(400).json({ success: false, message: 'Could not update coupon', error: error.message });
    }
};

const deleteCoupon = async (req, res) => {
    try {
        const coupon = await Coupon.findByPk(req.params.id);
        if (!coupon) {
            return res.status(404).json({ success: false, message: 'Coupon not found' });
        }
        await coupon.destroy();
        res.status(200).json({ success: true, message: 'Coupon removed' });
    } catch (error) {
        console.error('Error deleting coupon:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

const validateCoupon = async (req, res) => {
    try {
        const { code, orderAmount } = req.body;
        const coupon = await Coupon.findOne({ where: { code, is_active: true } });

        if (!coupon) {
            return res.status(404).json({ success: false, message: 'Mã giảm giá không tồn tại hoặc đã hết hạn.' });
        }

        const now = new Date();
        if (coupon.starts_at && now < new Date(coupon.starts_at)) {
            return res.status(400).json({ success: false, message: 'Mã giảm giá chưa đến thời gian sử dụng.' });
        }
        if (coupon.ends_at && now > new Date(coupon.ends_at)) {
            return res.status(400).json({ success: false, message: 'Mã giảm giá đã hết hạn.' });
        }

        if (coupon.min_order_amount && orderAmount < coupon.min_order_amount) {
            return res.status(400).json({ 
                success: false, 
                message: `Đơn hàng tối thiểu ${Number(coupon.min_order_amount).toLocaleString('vi-VN')}đ để sử dụng mã này.` 
            });
        }

        if (coupon.usage_limit_total && coupon.usage_count >= coupon.usage_limit_total) {
            return res.status(400).json({ success: false, message: 'Mã giảm giá đã hết lượt sử dụng.' });
        }

        // Nếu cần kiểm tra giới hạn mỗi user, bạn có thể bổ sung query Order để đếm số lần user đã dùng coupon này.

        res.status(200).json({ success: true, data: coupon });
    } catch (error) {
        console.error('Error validating coupon:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

module.exports = { getAllCoupons, getCouponById, createCoupon, updateCoupon, deleteCoupon, validateCoupon };
