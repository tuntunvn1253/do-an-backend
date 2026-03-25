const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Coupon = sequelize.define('Coupon', {
    id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
    code: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    description: { type: DataTypes.STRING(255), allowNull: true },
    discount_type: { type: DataTypes.ENUM('percent', 'amount'), allowNull: false },
    discount_value: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
    max_discount_amount: { type: DataTypes.DECIMAL(15, 2), allowNull: true },
    min_order_amount: { type: DataTypes.DECIMAL(15, 2), allowNull: true },
    usage_limit_total: { type: DataTypes.INTEGER, allowNull: true },
    usage_limit_per_user: { type: DataTypes.INTEGER, allowNull: true },
    usage_count: { type: DataTypes.INTEGER, defaultValue: 0 },
    starts_at: { type: DataTypes.DATE, allowNull: true },
    ends_at: { type: DataTypes.DATE, allowNull: true },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true }
}, {
    tableName: 'coupons',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

module.exports = Coupon;
