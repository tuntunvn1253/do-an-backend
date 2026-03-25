const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Product = sequelize.define('Product', {
    id: { 
        type: DataTypes.BIGINT.UNSIGNED, 
        primaryKey: true, 
        autoIncrement: true 
    },
    name: { 
        type: DataTypes.STRING(255), 
        allowNull: false 
    },
    slug: { 
        type: DataTypes.STRING(255), 
        allowNull: false, 
        unique: true 
    },
    price: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0.00
    },
    sale_price: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: true
    },
    stock_quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    sku: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    image_primary: { 
        type: DataTypes.STRING(255), 
        allowNull: true 
    },
    product_type: { 
        type: DataTypes.ENUM('shoe', 'candle', 'instrument', 'badminton', 'general'), 
        defaultValue: 'general' 
    },
    status: { 
        type: DataTypes.ENUM('draft', 'active', 'hidden'), 
        defaultValue: 'draft' 
    },
    is_featured: { 
        type: DataTypes.BOOLEAN, 
        defaultValue: false 
    },
    short_description: { 
        type: DataTypes.TEXT, 
        allowNull: true 
    },
    description: { 
        type: DataTypes.TEXT('long'), 
        allowNull: true 
    },
    guide_use: { 
        type: DataTypes.TEXT, 
        allowNull: true 
    },
    specifications: { 
        type: DataTypes.JSON, 
        allowNull: true 
    },
    brand_id: { 
        type: DataTypes.BIGINT.UNSIGNED, 
        allowNull: true 
    },
    category_id: {
        type: DataTypes.BIGINT.UNSIGNED, 
        allowNull: true 
    }
}, {
    tableName: 'products',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

module.exports = Product;
