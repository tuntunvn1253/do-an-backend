const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const crypto = require('crypto');

const Order = sequelize.define('Order', {
    id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
    order_code: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
    coupon_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
    order_status: { type: DataTypes.ENUM('pending','confirmed','shipping','delivered','cancelled','refunded','returned'), defaultValue: 'pending' },
    shipping_fee: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0.00 },
    payment_method: { type: DataTypes.ENUM('cod','vnpay','momo','stripe','banking'), defaultValue: 'cod' },
    payment_status: { type: DataTypes.ENUM('unpaid','paid','failed','refunded','partial_refund'), defaultValue: 'unpaid' },
    payment_time: { type: DataTypes.DATE, allowNull: true },
    transaction_id: { type: DataTypes.STRING(100), allowNull: true },
    shipping_name: { type: DataTypes.STRING(100), allowNull: false },
    shipping_phone: { type: DataTypes.STRING(20), allowNull: false },
    shipping_address: { type: DataTypes.TEXT, allowNull: false },
    customer_note: { type: DataTypes.TEXT, allowNull: true }
}, {
    tableName: 'orders',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    hooks: {
        beforeValidate: (order, options) => {
            if (!order.order_code) {
                const timestamp = Date.now().toString().slice(-6);
                const randomPart = crypto.randomBytes(2).toString('hex').toUpperCase();
                order.order_code = `CNC-${timestamp}-${randomPart}`;
            }
        }
    }
});

module.exports = Order;
