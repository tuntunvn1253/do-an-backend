const express = require('express');
const router = express.Router();
const {
    getBanners,
    getBannerById,
    createBanner,
    updateBanner,
    deleteBanner
} = require('../controllers/banner.controller');
const { protect, admin } = require('../middleware/auth.middleware');

// Đường dẫn: /api/banners
router.route('/')
    .get(getBanners) // Lấy danh sách banner (thường là công khai)
    .post(protect, admin, createBanner); // Chỉ Admin mới được thêm

// Đường dẫn: /api/banners/:id
router.route('/:id')
    .get(getBannerById)
    .put(protect, admin, updateBanner) // Chỉ Admin mới được sửa
    .delete(protect, admin, deleteBanner); // Chỉ Admin mới được xóa

module.exports = router;