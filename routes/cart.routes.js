const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const {
    getCart,
    addItemToCart,
    updateCartItem,
    removeItemFromCart,
    clearCart
} = require('../controllers/cart.controller');

router.use(protect);

router.route('/')
    .get(getCart)
    .post(addItemToCart)
    .delete(clearCart);

router.route('/:id')
    .put(updateCartItem)
    .delete(removeItemFromCart);

module.exports = router;
