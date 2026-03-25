const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Banner = sequelize.define('Banner', {
    id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
    },
    image_url: {
        type: DataTypes.STRING(255),
        allowNull: false,
    },
    link_url: {
        type: DataTypes.STRING(255),
        allowNull: true,
    },
    position: {
        type: DataTypes.STRING(50),
        defaultValue: 'home_slider',
    },
    sort_order: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
    is_active: {
        type: DataTypes.TINYINT(1), 
        defaultValue: 1,
        get() {
            const value = this.getDataValue('is_active');
            return value === 1 || value === true;
        }
    },
}, {
    tableName: 'banners',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at', // Nhớ đổi thành updatedAt (viết hoa chữ A) để Sequelize hiểu đúng
    underscored: true,
});

module.exports = Banner;