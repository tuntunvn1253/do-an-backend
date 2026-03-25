const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Logo = sequelize.define('Logo', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    image_data: {
        type: DataTypes.BLOB('long'),
        allowNull: false
    },
    image_type: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    name: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    tableName: 'logos',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

module.exports = Logo;
