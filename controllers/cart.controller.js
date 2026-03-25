const { Cart, CartItem, ProductVariant, Product, VariantImage } = require('../models');
exports.getCart = async (req, res) => {
    try {
        let cart = await Cart.findOne({
            where: { user_id: req.user.id },
            include: [
                {
                    model: CartItem,
                    as: 'items',
                    include: [
                        {
                            model: ProductVariant,
                            as: 'variant',
                            include: [
                                {
                                    model: Product,
                                    as: 'product'
                                },
                                {
                                    model: VariantImage,
                                    as: 'images'
                                }
                            ]
                        }
                    ]
                }
            ]
        });

        if (!cart) {
            cart = await Cart.create({ user_id: req.user.id });
            cart = await Cart.findByPk(cart.id, { include: [{ model: CartItem, as: 'items' }] });
        }

        res.status(200).json({
            success: true,
            data: cart
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};

exports.addItemToCart = async (req, res) => {
    try {
        const { product_variant_id, quantity } = req.body;

        let cart = await Cart.findOne({ where: { user_id: req.user.id } });

        if (!cart) {
            cart = await Cart.create({ user_id: req.user.id });
        }

        let cartItem = await CartItem.findOne({
            where: {
                cart_id: cart.id,
                product_variant_id: product_variant_id
            }
        });

        if (cartItem) {
            cartItem.quantity += parseInt(quantity);
            await cartItem.save();
        } else {
            cartItem = await CartItem.create({
                cart_id: cart.id,
                product_variant_id,
                quantity
            });
        }

        res.status(200).json({
            success: true,
            data: cartItem
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};

exports.updateCartItem = async (req, res) => {
    try {
        const { quantity } = req.body;
        const cartItem = await CartItem.findByPk(req.params.id, {
            include: [{ model: Cart, where: { user_id: req.user.id } }]
        });

        if (!cartItem) {
            return res.status(404).json({
                success: false,
                message: 'Cart item not found'
            });
        }

        cartItem.quantity = quantity;
        await cartItem.save();

        res.status(200).json({
            success: true,
            data: cartItem
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};

exports.removeItemFromCart = async (req, res) => {
    try {
        const cartItem = await CartItem.findByPk(req.params.id, {
            include: [{ model: Cart, where: { user_id: req.user.id } }]
        });

        if (!cartItem) {
            return res.status(404).json({
                success: false,
                message: 'Cart item not found'
            });
        }

        await cartItem.destroy();

        res.status(200).json({
            success: true,
            message: 'Item removed from cart'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};

exports.clearCart = async (req, res) => {
    try {
        const cart = await Cart.findOne({ where: { user_id: req.user.id } });

        if (cart) {
            await CartItem.destroy({ where: { cart_id: cart.id } });
        }

        res.status(200).json({
            success: true,
            message: 'Cart cleared'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};
