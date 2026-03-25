const express = require('express');
const router = express.Router();
const {
    getAllBrands,
    getBrandById,
    createBrand,
    updateBrand,
    deleteBrand
} = require('../controllers/brand.controller');
const { protect, admin } = require('../middleware/auth.middleware');

router.route('/')
    .get(getAllBrands)
    .post(protect, admin, createBrand);

router.route('/:id')
    .get(getBrandById)
    .put(protect, admin, updateBrand)
    .delete(protect, admin, deleteBrand);

module.exports = router;
