const express = require('express');
const router = express.Router();
const { 
    createOrder, 
    getMyOrders, 
    getOrderById,
    getAllOrders,
    updateOrderStatus
} = require('../controllers/order.controller');
const { protect, admin } = require('../middleware/auth.middleware');

router.route('/')
    .post(protect, createOrder)
    .get(protect, admin, getAllOrders);

router.route('/myorders')
    .get(protect, getMyOrders);

router.route('/:id/status')
    .put(protect, admin, updateOrderStatus);

router.route('/:id')
    .get(protect, getOrderById);

module.exports = router;
